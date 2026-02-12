package com.hrsystem.service;

import com.hrsystem.domain.model.*;
import com.hrsystem.domain.model.enums.EvaluationPeriod;
import com.hrsystem.domain.model.enums.EvaluationStatus;
import com.hrsystem.domain.model.enums.TenantPlan;
import com.hrsystem.domain.repository.*;
import com.hrsystem.security.TenantContext;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * EvaluationWorkflowService の単体テスト。
 * 評価ワークフローの全ステータス遷移パターンを検証する。
 */
@ExtendWith(MockitoExtension.class)
class EvaluationWorkflowServiceTest {

    @InjectMocks
    private EvaluationWorkflowService service;

    @Mock
    private EvaluationRepository evaluationRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    private Tenant tenant;
    private Department department;
    private Position staffPosition;
    private Position managerPosition;
    private Position directorPosition;
    private User staffUser;
    private User evaluatorUser;
    private User managerUser;
    private User directorUser;
    private FiscalYear fiscalYear;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(1L);

        tenant = Tenant.builder().id(1L).name("テスト会社").subdomain("test").plan(TenantPlan.PROFESSIONAL).build();

        department = Department.builder().id(1L).tenant(tenant).name("開発部").build();

        staffPosition = Position.builder().id(6L).tenant(tenant).code(5).name("一般").sortOrder(5)
                .canViewAll(false).canEvaluate(false).canFinalApprove(false).build();

        managerPosition = Position.builder().id(3L).tenant(tenant).code(2).name("部門長").sortOrder(2)
                .canViewAll(true).canEvaluate(true).canFinalApprove(false).build();

        directorPosition = Position.builder().id(2L).tenant(tenant).code(1).name("役員").sortOrder(1)
                .canViewAll(true).canEvaluate(true).canFinalApprove(true).build();

        staffUser = User.builder().id(1L).tenant(tenant).department(department)
                .position(staffPosition).name("鈴木 一郎").email("staff@test.com").password("hashed").build();

        evaluatorUser = User.builder().id(2L).tenant(tenant).department(department)
                .position(staffPosition).name("佐藤 花子").email("eval@test.com").password("hashed")
                .canEvaluate(true).build();

        managerUser = User.builder().id(3L).tenant(tenant).department(department)
                .position(managerPosition).name("山田 太郎").email("mgr@test.com").password("hashed").build();

        directorUser = User.builder().id(4L).tenant(tenant).department(department)
                .position(directorPosition).name("田中 社長").email("dir@test.com").password("hashed").build();

        fiscalYear = FiscalYear.builder().id(1L).tenant(tenant).year(2026).isCurrent(true).build();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ================================================================
    // 自己評価提出
    // ================================================================

    @Test
    @DisplayName("自己評価提出: NOT_STARTED → SELF_SUBMITTED")
    void submitSelfEvaluation_success() {
        Evaluation eval = createEvaluation(EvaluationStatus.NOT_STARTED);
        when(evaluationRepository.findById(1L)).thenReturn(Optional.of(eval));
        when(evaluationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Evaluation result = service.submitSelfEvaluation(1L, staffUser.getId());

        assertThat(result.getStatus()).isEqualTo(EvaluationStatus.SELF_SUBMITTED);
        verify(notificationRepository).save(argThat(n ->
                n.getUser().getId().equals(evaluatorUser.getId()) &&
                n.getType().equals("self_submitted")
        ));
    }

    @Test
    @DisplayName("自己評価提出: 既に提出済みの場合は例外")
    void submitSelfEvaluation_alreadySubmitted() {
        Evaluation eval = createEvaluation(EvaluationStatus.SELF_SUBMITTED);
        when(evaluationRepository.findById(1L)).thenReturn(Optional.of(eval));

        assertThatThrownBy(() -> service.submitSelfEvaluation(1L, staffUser.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("自己評価を提出できるステータスではありません");
    }

    @Test
    @DisplayName("自己評価提出: 他人の評価に対しては例外")
    void submitSelfEvaluation_wrongUser() {
        Evaluation eval = createEvaluation(EvaluationStatus.NOT_STARTED);
        when(evaluationRepository.findById(1L)).thenReturn(Optional.of(eval));

        assertThatThrownBy(() -> service.submitSelfEvaluation(1L, 999L))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("この評価の対象者ではありません");
    }

    // ================================================================
    // 評価者による評価送信（通常フロー）
    // ================================================================

    @Test
    @DisplayName("評価者評価: SELF_SUBMITTED → EVALUATOR_SUBMITTED（通常フロー）")
    void submitEvaluatorEvaluation_normalFlow() {
        Evaluation eval = createEvaluation(EvaluationStatus.SELF_SUBMITTED);
        when(evaluationRepository.findById(1L)).thenReturn(Optional.of(eval));
        when(userRepository.findById(evaluatorUser.getId())).thenReturn(Optional.of(evaluatorUser));
        when(userRepository.findEvaluatorCandidates(1L, 1L)).thenReturn(List.of(managerUser));
        when(evaluationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Evaluation result = service.submitEvaluatorEvaluation(1L, evaluatorUser.getId(), "A", "よく頑張りました");

        assertThat(result.getStatus()).isEqualTo(EvaluationStatus.EVALUATOR_SUBMITTED);
        assertThat(result.getEvaluatorGrade()).isEqualTo("A");
        assertThat(result.getEvaluatorComment()).isEqualTo("よく頑張りました");
        assertThat(result.getEvaluatedAt()).isNotNull();
    }

    // ================================================================
    // 評価者が理事長の場合（スキップ）
    // ================================================================

    @Test
    @DisplayName("評価者が理事長: 施設長確認スキップ → DIRECTOR_EVALUATED")
    void submitEvaluatorEvaluation_directorAsEvaluator() {
        Evaluation eval = createEvaluation(EvaluationStatus.SELF_SUBMITTED);
        eval.setEvaluator(directorUser);
        when(evaluationRepository.findById(1L)).thenReturn(Optional.of(eval));
        when(userRepository.findById(directorUser.getId())).thenReturn(Optional.of(directorUser));
        when(evaluationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Evaluation result = service.submitEvaluatorEvaluation(1L, directorUser.getId(), "S", "素晴らしい");

        assertThat(result.getStatus()).isEqualTo(EvaluationStatus.DIRECTOR_EVALUATED);
        assertThat(result.getDirectorGrade()).isEqualTo("S");
        assertThat(result.getDirector()).isEqualTo(directorUser);
    }

    // ================================================================
    // 管理者承認
    // ================================================================

    @Test
    @DisplayName("管理者承認: EVALUATOR_SUBMITTED → MANAGER_APPROVED")
    void approveByManager_success() {
        Evaluation eval = createEvaluation(EvaluationStatus.EVALUATOR_SUBMITTED);
        when(evaluationRepository.findById(1L)).thenReturn(Optional.of(eval));
        when(userRepository.findById(managerUser.getId())).thenReturn(Optional.of(managerUser));
        when(userRepository.findDirectorsAndAdmins(1L)).thenReturn(List.of(directorUser));
        when(evaluationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Evaluation result = service.approveByManager(1L, managerUser.getId(), "A", "承認します");

        assertThat(result.getStatus()).isEqualTo(EvaluationStatus.MANAGER_APPROVED);
        assertThat(result.getManagerGrade()).isEqualTo("A");
        assertThat(result.getManagerApprovedAt()).isNotNull();
        verify(notificationRepository).save(argThat(n ->
                n.getUser().getId().equals(directorUser.getId())
        ));
    }

    // ================================================================
    // 管理者差し戻し
    // ================================================================

    @Test
    @DisplayName("管理者差し戻し: EVALUATOR_SUBMITTED → SELF_SUBMITTED")
    void rejectByManager_success() {
        Evaluation eval = createEvaluation(EvaluationStatus.EVALUATOR_SUBMITTED);
        when(evaluationRepository.findById(1L)).thenReturn(Optional.of(eval));
        when(evaluationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Evaluation result = service.rejectByManager(1L, "評価内容を見直してください");

        assertThat(result.getStatus()).isEqualTo(EvaluationStatus.SELF_SUBMITTED);
        assertThat(result.getManager()).isNull();
        assertThat(result.getManagerGrade()).isNull();
    }

    // ================================================================
    // 役員評価
    // ================================================================

    @Test
    @DisplayName("役員評価: MANAGER_APPROVED → DIRECTOR_EVALUATED")
    void submitDirectorEvaluation_success() {
        Evaluation eval = createEvaluation(EvaluationStatus.MANAGER_APPROVED);
        when(evaluationRepository.findById(1L)).thenReturn(Optional.of(eval));
        when(userRepository.findById(directorUser.getId())).thenReturn(Optional.of(directorUser));
        when(evaluationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Evaluation result = service.submitDirectorEvaluation(1L, directorUser.getId(), "A+", "優秀です");

        assertThat(result.getStatus()).isEqualTo(EvaluationStatus.DIRECTOR_EVALUATED);
        assertThat(result.getDirectorGrade()).isEqualTo("A+");
        assertThat(result.getDirectorEvaluatedAt()).isNotNull();
    }

    // ================================================================
    // 役員差し戻し（通常職員 → 施設長に差し戻し）
    // ================================================================

    @Test
    @DisplayName("役員差し戻し（通常）: MANAGER_APPROVED → EVALUATOR_SUBMITTED")
    void rejectByDirector_normalStaff() {
        Evaluation eval = createEvaluation(EvaluationStatus.MANAGER_APPROVED);
        eval.setManager(managerUser);
        eval.setManagerGrade("A");
        when(evaluationRepository.findById(1L)).thenReturn(Optional.of(eval));
        when(userRepository.findEvaluatorCandidates(1L, 1L)).thenReturn(List.of(managerUser));
        when(evaluationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Evaluation result = service.rejectByDirector(1L, "再確認をお願いします");

        assertThat(result.getStatus()).isEqualTo(EvaluationStatus.EVALUATOR_SUBMITTED);
        assertThat(result.getDirector()).isNull();
        assertThat(result.getManager()).isNull();
    }

    // ================================================================
    // 役員差し戻し（上位職 → 評価者に直接差し戻し）
    // ================================================================

    @Test
    @DisplayName("役員差し戻し（上位職）: → SELF_SUBMITTED + 評価者フィールドクリア")
    void rejectByDirector_seniorStaff() {
        Evaluation eval = createEvaluation(EvaluationStatus.MANAGER_APPROVED);
        // 被評価者を管理者（code=2）に変更
        eval.setUser(managerUser);
        eval.setEvaluatorGrade("B");
        eval.setEvaluatorComment("コメント");
        when(evaluationRepository.findById(1L)).thenReturn(Optional.of(eval));
        when(evaluationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Evaluation result = service.rejectByDirector(1L, "見直し");

        assertThat(result.getStatus()).isEqualTo(EvaluationStatus.SELF_SUBMITTED);
        assertThat(result.getEvaluatorGrade()).isNull();
        assertThat(result.getEvaluatorComment()).isNull();
        assertThat(result.getDirector()).isNull();
    }

    // ================================================================
    // 最終確定
    // ================================================================

    @Test
    @DisplayName("最終確定: DIRECTOR_EVALUATED → FINALIZED + 本人通知")
    void finalizeEvaluation_success() {
        Evaluation eval = createEvaluation(EvaluationStatus.DIRECTOR_EVALUATED);
        eval.setDirectorGrade("A");
        when(evaluationRepository.findById(1L)).thenReturn(Optional.of(eval));
        when(evaluationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Evaluation result = service.finalizeEvaluation(1L);

        assertThat(result.getStatus()).isEqualTo(EvaluationStatus.FINALIZED);
        assertThat(result.getFinalizedAt()).isNotNull();
        verify(notificationRepository).save(argThat(n ->
                n.getUser().getId().equals(staffUser.getId()) &&
                n.getType().equals("evaluation_finalized")
        ));
    }

    @Test
    @DisplayName("最終確定: 確定済みの場合は例外")
    void finalizeEvaluation_alreadyFinalized() {
        Evaluation eval = createEvaluation(EvaluationStatus.FINALIZED);
        when(evaluationRepository.findById(1L)).thenReturn(Optional.of(eval));

        assertThatThrownBy(() -> service.finalizeEvaluation(1L))
                .isInstanceOf(IllegalStateException.class);
    }

    // ================================================================
    // ヘルパー
    // ================================================================

    private Evaluation createEvaluation(EvaluationStatus status) {
        return Evaluation.builder()
                .id(1L)
                .tenant(tenant)
                .user(staffUser)
                .evaluator(evaluatorUser)
                .fiscalYear(fiscalYear)
                .period(EvaluationPeriod.SUMMER)
                .department(department)
                .position(staffPosition)
                .status(status)
                .build();
    }
}
