package com.hrsystem.service;

import com.hrsystem.domain.model.*;
import com.hrsystem.domain.model.enums.EvaluationStatus;
import com.hrsystem.domain.repository.*;
import com.hrsystem.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 評価ワークフローのコアロジック。
 * 6段階のステータス遷移と差し戻し処理を管理する。
 *
 * ワークフロー:
 * NOT_STARTED → SELF_SUBMITTED → EVALUATOR_SUBMITTED → MANAGER_APPROVED
 *     → DIRECTOR_EVALUATED → FINALIZED
 *
 * スキップ条件:
 * - 評価者が理事長/管理者 → EVALUATOR_SUBMITTED をスキップし DIRECTOR_EVALUATED へ
 * - 被評価者が上位職(code<=2) → EVALUATOR_SUBMITTED をスキップし MANAGER_APPROVED へ
 */
@Service
@RequiredArgsConstructor
@Transactional
public class EvaluationWorkflowService {

    private final EvaluationRepository evaluationRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    // ===== 自己評価提出 =====

    public Evaluation submitSelfEvaluation(Long evaluationId, Long userId) {
        Evaluation eval = findAndVerifyOwner(evaluationId, userId);

        if (!eval.canSelfEvaluate()) {
            throw new IllegalStateException("自己評価を提出できるステータスではありません");
        }

        eval.setStatus(EvaluationStatus.SELF_SUBMITTED);
        evaluationRepository.save(eval);

        if (eval.getEvaluator() != null) {
            notify(eval.getEvaluator(), "self_submitted",
                    "自己評価が提出されました",
                    eval.getUser().getName() + "さんが自己評価を提出しました。",
                    "/evaluator/evaluate/" + eval.getId());
        }

        return eval;
    }

    // ===== 評価者による評価送信 =====

    public Evaluation submitEvaluatorEvaluation(Long evaluationId, Long evaluatorId,
                                                 String grade, String comment) {
        Long tenantId = TenantContext.getTenantId();
        Evaluation eval = findById(evaluationId);
        verifyEvaluator(eval, evaluatorId);

        if (!eval.canEvaluatorSubmit()) {
            throw new IllegalStateException("評価を送信できるステータスではありません");
        }

        eval.setEvaluatorGrade(grade);
        eval.setEvaluatorComment(comment);
        eval.setEvaluatedAt(LocalDateTime.now());

        User evaluator = findUser(evaluatorId);

        if (evaluator.isDirector() || evaluator.isSystemAdmin()) {
            // 理事長が評価者 → 施設長確認スキップ、直接 DIRECTOR_EVALUATED
            eval.setDirectorGrade(grade);
            eval.setDirectorComment(comment);
            eval.setDirector(evaluator);
            eval.setDirectorEvaluatedAt(LocalDateTime.now());
            eval.setStatus(EvaluationStatus.DIRECTOR_EVALUATED);
            notify(evaluator, "director_evaluated", "最終確認が必要です",
                    eval.getUser().getName() + "さんの評価を最終確認してください。",
                    "/director/finalize/" + eval.getId());

        } else if (eval.getUser().isSeniorStaff()) {
            // 被評価者が上位職 → 施設長確認スキップして理事長評価へ
            eval.setStatus(EvaluationStatus.MANAGER_APPROVED);
            notifyDirectors(tenantId, eval);

        } else {
            // 通常フロー → 施設長確認
            eval.setStatus(EvaluationStatus.EVALUATOR_SUBMITTED);
            notifyManagers(eval);
        }

        return evaluationRepository.save(eval);
    }

    // ===== 管理者（施設長）承認 =====

    public Evaluation approveByManager(Long evaluationId, Long managerId,
                                        String grade, String comment) {
        Long tenantId = TenantContext.getTenantId();
        Evaluation eval = findById(evaluationId);

        if (!eval.canManagerApprove()) {
            throw new IllegalStateException("管理者確認できるステータスではありません");
        }

        eval.setManager(findUser(managerId));
        eval.setManagerGrade(grade);
        eval.setManagerComment(comment);
        eval.setManagerApprovedAt(LocalDateTime.now());
        eval.setStatus(EvaluationStatus.MANAGER_APPROVED);
        evaluationRepository.save(eval);

        notifyDirectors(tenantId, eval);
        return eval;
    }

    // ===== 管理者差し戻し =====

    public Evaluation rejectByManager(Long evaluationId, String reason) {
        Evaluation eval = findById(evaluationId);

        eval.setStatus(EvaluationStatus.SELF_SUBMITTED);
        clearManagerFields(eval);
        evaluationRepository.save(eval);

        if (eval.getEvaluator() != null) {
            notify(eval.getEvaluator(), "evaluation_rejected", "評価が差し戻されました",
                    eval.getUser().getName() + "さんの評価が差し戻されました。"
                            + appendReason(reason),
                    "/evaluator/evaluate/" + eval.getId());
        }

        return eval;
    }

    // ===== 役員（理事長）評価 =====

    public Evaluation submitDirectorEvaluation(Long evaluationId, Long directorId,
                                                String grade, String comment) {
        Evaluation eval = findById(evaluationId);

        if (!eval.canDirectorEvaluate()) {
            throw new IllegalStateException("役員評価できるステータスではありません");
        }

        User director = findUser(directorId);
        eval.setDirector(director);
        eval.setDirectorGrade(grade);
        eval.setDirectorComment(comment);
        eval.setDirectorEvaluatedAt(LocalDateTime.now());
        eval.setStatus(EvaluationStatus.DIRECTOR_EVALUATED);
        evaluationRepository.save(eval);

        notify(director, "director_evaluated", "最終確認が必要です",
                eval.getUser().getName() + "さんの評価を最終確認してください。",
                "/director/finalize/" + eval.getId());

        return eval;
    }

    // ===== 役員差し戻し =====

    public Evaluation rejectByDirector(Long evaluationId, String reason) {
        Evaluation eval = findById(evaluationId);

        if (eval.getUser().isSeniorStaff()) {
            // 上位職 → 評価者に直接差し戻し
            eval.setStatus(EvaluationStatus.SELF_SUBMITTED);
            clearDirectorFields(eval);
            clearEvaluatorFields(eval);

            if (eval.getEvaluator() != null) {
                notify(eval.getEvaluator(), "evaluation_rejected", "評価が差し戻されました",
                        eval.getUser().getName() + "さんの評価を再評価してください。"
                                + appendReason(reason),
                        "/evaluator/evaluate/" + eval.getId());
            }
        } else {
            // 通常 → 施設長に差し戻し
            eval.setStatus(EvaluationStatus.EVALUATOR_SUBMITTED);
            clearDirectorFields(eval);
            clearManagerFields(eval);
            notifyManagers(eval);
        }

        return evaluationRepository.save(eval);
    }

    // ===== 最終確定 =====

    public Evaluation finalizeEvaluation(Long evaluationId) {
        Evaluation eval = findById(evaluationId);

        if (!eval.canFinalize()) {
            throw new IllegalStateException("最終確定できるステータスではありません");
        }

        eval.setFinalizedAt(LocalDateTime.now());
        eval.setStatus(EvaluationStatus.FINALIZED);
        evaluationRepository.save(eval);

        notify(eval.getUser(), "evaluation_finalized", "評価が確定しました",
                eval.getFiscalYear().getYear() + "年度"
                        + eval.getPeriod().getLabel() + "の評価が確定しました。",
                "/my-evaluations");

        return eval;
    }

    // ===== Private Helpers =====

    private Evaluation findById(Long id) {
        return evaluationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("評価が見つかりません: " + id));
    }

    private Evaluation findAndVerifyOwner(Long evaluationId, Long userId) {
        Evaluation eval = findById(evaluationId);
        if (!eval.getUser().getId().equals(userId)) {
            throw new SecurityException("この評価の対象者ではありません");
        }
        return eval;
    }

    private void verifyEvaluator(Evaluation eval, Long evaluatorId) {
        if (!eval.getEvaluator().getId().equals(evaluatorId)) {
            throw new SecurityException("この評価の評価者ではありません");
        }
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("ユーザーが見つかりません: " + userId));
    }

    private void notify(User recipient, String type, String title, String message, String link) {
        notificationRepository.save(Notification.builder()
                .tenant(recipient.getTenant())
                .user(recipient)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .build());
    }

    private void notifyDirectors(Long tenantId, Evaluation eval) {
        List<User> directors = userRepository.findDirectorsAndAdmins(tenantId);
        for (User d : directors) {
            notify(d, "manager_approved", "理事長評価が必要です",
                    eval.getUser().getName() + "さんの評価が承認されました。",
                    "/director/evaluate/" + eval.getId());
        }
    }

    private void notifyManagers(Evaluation eval) {
        if (eval.getDepartment() == null) return;
        Long tenantId = TenantContext.getTenantId();
        List<User> candidates = userRepository.findEvaluatorCandidates(
                tenantId, eval.getDepartment().getId());
        candidates.stream()
                .filter(User::isManager)
                .forEach(m -> notify(m, "evaluator_completed", "評価が完了しました",
                        eval.getUser().getName() + "さんの評価が完了しました。",
                        "/manager/review/" + eval.getId()));
    }

    private void clearEvaluatorFields(Evaluation eval) {
        eval.setEvaluatorGrade(null);
        eval.setEvaluatorComment(null);
        eval.setEvaluatedAt(null);
    }

    private void clearManagerFields(Evaluation eval) {
        eval.setManager(null);
        eval.setManagerGrade(null);
        eval.setManagerComment(null);
        eval.setManagerApprovedAt(null);
    }

    private void clearDirectorFields(Evaluation eval) {
        eval.setDirector(null);
        eval.setDirectorGrade(null);
        eval.setDirectorComment(null);
        eval.setDirectorEvaluatedAt(null);
    }

    private String appendReason(String reason) {
        return (reason != null && !reason.isBlank()) ? " 理由: " + reason : "";
    }
}
