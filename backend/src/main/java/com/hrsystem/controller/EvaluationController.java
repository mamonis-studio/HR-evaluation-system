package com.hrsystem.controller;

import com.hrsystem.domain.model.Evaluation;
import com.hrsystem.domain.model.User;
import com.hrsystem.domain.model.enums.EvaluationStatus;
import com.hrsystem.domain.repository.EvaluationRepository;
import com.hrsystem.security.TenantContext;
import com.hrsystem.service.EvaluationWorkflowService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationRepository evaluationRepository;
    private final EvaluationWorkflowService workflowService;

    // ===== DTOs =====

    public record EvaluateRequest(
            @NotBlank String grade,
            String comment
    ) {}

    public record RejectRequest(String reason) {}

    // ===== 自分の評価一覧 =====

    @GetMapping("/mine")
    public ResponseEntity<List<Evaluation>> getMyEvaluations(@AuthenticationPrincipal User user) {
        Long tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(
                evaluationRepository.findByTenantIdAndUserIdOrderByFiscalYearDesc(tenantId, user.getId()));
    }

    // ===== 評価待ち一覧（評価者用） =====

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('EVALUATOR', 'ADMIN')")
    public ResponseEntity<List<Evaluation>> getPendingEvaluations(@AuthenticationPrincipal User user) {
        Long tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(
                evaluationRepository.findByTenantIdAndEvaluatorIdAndStatus(
                        tenantId, user.getId(), EvaluationStatus.SELF_SUBMITTED));
    }

    // ===== 自己評価提出 =====

    @PostMapping("/{id}/self-evaluate")
    public ResponseEntity<Evaluation> submitSelfEvaluation(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workflowService.submitSelfEvaluation(id, user.getId()));
    }

    // ===== 評価者評価送信 =====

    @PostMapping("/{id}/evaluate")
    @PreAuthorize("hasAnyRole('EVALUATOR', 'ADMIN')")
    public ResponseEntity<Evaluation> submitEvaluation(
            @PathVariable Long id,
            @Valid @RequestBody EvaluateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workflowService.submitEvaluatorEvaluation(
                id, user.getId(), request.grade(), request.comment()));
    }

    // ===== 管理者承認 =====

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'DIRECTOR', 'ADMIN')")
    public ResponseEntity<Evaluation> approve(
            @PathVariable Long id,
            @Valid @RequestBody EvaluateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workflowService.approveByManager(
                id, user.getId(), request.grade(), request.comment()));
    }

    // ===== 差し戻し =====

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('MANAGER', 'DIRECTOR', 'ADMIN')")
    public ResponseEntity<Evaluation> reject(
            @PathVariable Long id,
            @RequestBody RejectRequest request,
            @AuthenticationPrincipal User user) {
        // 管理者か役員かで差し戻し先が変わる
        if (user.isDirector() || user.isSystemAdmin()) {
            return ResponseEntity.ok(workflowService.rejectByDirector(id, request.reason()));
        } else {
            return ResponseEntity.ok(workflowService.rejectByManager(id, request.reason()));
        }
    }

    // ===== 役員評価 =====

    @PostMapping("/{id}/director-evaluate")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'ADMIN')")
    public ResponseEntity<Evaluation> directorEvaluate(
            @PathVariable Long id,
            @Valid @RequestBody EvaluateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workflowService.submitDirectorEvaluation(
                id, user.getId(), request.grade(), request.comment()));
    }

    // ===== 最終確定 =====

    @PostMapping("/{id}/finalize")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'ADMIN')")
    public ResponseEntity<Evaluation> finalize(@PathVariable Long id) {
        return ResponseEntity.ok(workflowService.finalizeEvaluation(id));
    }

    // ===== ダッシュボード用カウント =====

    @GetMapping("/counts")
    public ResponseEntity<Map<String, Long>> getCounts(@AuthenticationPrincipal User user) {
        Long tenantId = TenantContext.getTenantId();

        long pendingEvaluations = user.canPerformEvaluation()
                ? evaluationRepository.countPendingForEvaluator(tenantId, user.getId(), EvaluationStatus.SELF_SUBMITTED)
                : 0;

        long managerPending = user.isManager() && user.getDepartment() != null
                ? evaluationRepository.countPendingForDepartment(tenantId, user.getDepartment().getId(), EvaluationStatus.EVALUATOR_SUBMITTED)
                : 0;

        long directorPending = user.isDirector() || user.isSystemAdmin()
                ? evaluationRepository.countByTenantAndStatus(tenantId, EvaluationStatus.MANAGER_APPROVED)
                : 0;

        long finalizePending = user.isDirector() || user.isSystemAdmin()
                ? evaluationRepository.countByTenantAndStatus(tenantId, EvaluationStatus.DIRECTOR_EVALUATED)
                : 0;

        return ResponseEntity.ok(Map.of(
                "pendingEvaluations", pendingEvaluations,
                "managerPending", managerPending,
                "directorPending", directorPending,
                "finalizePending", finalizePending
        ));
    }
}
