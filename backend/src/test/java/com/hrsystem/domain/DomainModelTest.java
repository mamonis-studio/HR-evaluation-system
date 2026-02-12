package com.hrsystem.domain;

import com.hrsystem.domain.model.*;
import com.hrsystem.domain.model.enums.EvaluationPeriod;
import com.hrsystem.domain.model.enums.EvaluationStatus;
import com.hrsystem.domain.model.enums.TenantPlan;
import org.junit.jupiter.api.*;

import static org.assertj.core.api.Assertions.*;

/**
 * ドメインモデルの単体テスト。
 * エンティティのビジネスロジック（権限判定、ワークフロー判定）を検証する。
 */
class DomainModelTest {

    private Tenant tenant;

    @BeforeEach
    void setUp() {
        tenant = Tenant.builder().id(1L).name("テスト").subdomain("test").build();
    }

    // ================================================================
    // User の権限判定
    // ================================================================

    @Test
    @DisplayName("一般職員は全体閲覧・評価・最終承認いずれも不可")
    void staffPermissions() {
        Position staff = Position.builder().code(5).canViewAll(false).canEvaluate(false).canFinalApprove(false).build();
        User user = User.builder().position(staff).canEvaluate(false).build();

        assertThat(user.canViewAll()).isFalse();
        assertThat(user.canPerformEvaluation()).isFalse();
        assertThat(user.canFinalApprove()).isFalse();
        assertThat(user.isManager()).isFalse();
        assertThat(user.isDirector()).isFalse();
    }

    @Test
    @DisplayName("部門長はcanViewAllとcanEvaluateが有効")
    void managerPermissions() {
        Position mgr = Position.builder().code(2).canViewAll(true).canEvaluate(true).canFinalApprove(false).build();
        User user = User.builder().position(mgr).build();

        assertThat(user.canViewAll()).isTrue();
        assertThat(user.canPerformEvaluation()).isTrue();
        assertThat(user.canFinalApprove()).isFalse();
        assertThat(user.isManager()).isTrue();
        assertThat(user.isSeniorStaff()).isTrue();
    }

    @Test
    @DisplayName("役員は全権限を持つ")
    void directorPermissions() {
        Position dir = Position.builder().code(1).canViewAll(true).canEvaluate(true).canFinalApprove(true).build();
        User user = User.builder().position(dir).build();

        assertThat(user.canViewAll()).isTrue();
        assertThat(user.canPerformEvaluation()).isTrue();
        assertThat(user.canFinalApprove()).isTrue();
        assertThat(user.isDirector()).isTrue();
        assertThat(user.isSeniorStaff()).isTrue();
    }

    @Test
    @DisplayName("ユーザー個別のcanEvaluateフラグでも評価可能")
    void userLevelEvaluateFlag() {
        Position staff = Position.builder().code(5).canEvaluate(false).build();
        User user = User.builder().position(staff).canEvaluate(true).build();

        assertThat(user.canPerformEvaluation()).isTrue();
    }

    @Test
    @DisplayName("positionがnullの場合は全権限false")
    void nullPositionPermissions() {
        User user = User.builder().position(null).build();

        assertThat(user.canViewAll()).isFalse();
        assertThat(user.canFinalApprove()).isFalse();
        assertThat(user.isManager()).isFalse();
        assertThat(user.isDirector()).isFalse();
    }

    // ================================================================
    // Evaluation ワークフロー判定
    // ================================================================

    @Test
    @DisplayName("NOT_STARTEDの時だけ自己評価提出可能")
    void canSelfEvaluate() {
        assertThat(eval(EvaluationStatus.NOT_STARTED).canSelfEvaluate()).isTrue();
        assertThat(eval(EvaluationStatus.SELF_SUBMITTED).canSelfEvaluate()).isFalse();
        assertThat(eval(EvaluationStatus.FINALIZED).canSelfEvaluate()).isFalse();
    }

    @Test
    @DisplayName("SELF_SUBMITTEDの時だけ評価者送信可能")
    void canEvaluatorSubmit() {
        assertThat(eval(EvaluationStatus.SELF_SUBMITTED).canEvaluatorSubmit()).isTrue();
        assertThat(eval(EvaluationStatus.NOT_STARTED).canEvaluatorSubmit()).isFalse();
        assertThat(eval(EvaluationStatus.EVALUATOR_SUBMITTED).canEvaluatorSubmit()).isFalse();
    }

    @Test
    @DisplayName("EVALUATOR_SUBMITTEDの時だけ管理者承認可能")
    void canManagerApprove() {
        assertThat(eval(EvaluationStatus.EVALUATOR_SUBMITTED).canManagerApprove()).isTrue();
        assertThat(eval(EvaluationStatus.SELF_SUBMITTED).canManagerApprove()).isFalse();
    }

    @Test
    @DisplayName("MANAGER_APPROVEDの時だけ役員評価可能")
    void canDirectorEvaluate() {
        assertThat(eval(EvaluationStatus.MANAGER_APPROVED).canDirectorEvaluate()).isTrue();
        assertThat(eval(EvaluationStatus.EVALUATOR_SUBMITTED).canDirectorEvaluate()).isFalse();
    }

    @Test
    @DisplayName("DIRECTOR_EVALUATEDの時だけ最終確定可能")
    void canFinalize() {
        assertThat(eval(EvaluationStatus.DIRECTOR_EVALUATED).canFinalize()).isTrue();
        assertThat(eval(EvaluationStatus.MANAGER_APPROVED).canFinalize()).isFalse();
        assertThat(eval(EvaluationStatus.FINALIZED).canFinalize()).isFalse();
    }

    // ================================================================
    // TenantPlan
    // ================================================================

    @Test
    @DisplayName("プランごとのユーザー上限値が正しい")
    void tenantPlanLimits() {
        assertThat(TenantPlan.FREE.getMaxUsers()).isEqualTo(10);
        assertThat(TenantPlan.STARTER.getMaxUsers()).isEqualTo(50);
        assertThat(TenantPlan.PROFESSIONAL.getMaxUsers()).isEqualTo(200);
        assertThat(TenantPlan.ENTERPRISE.getMaxUsers()).isEqualTo(Integer.MAX_VALUE);
    }

    // ================================================================
    // FiscalYear 期間判定
    // ================================================================

    @Test
    @DisplayName("夏・冬の自己評価/評価オープン判定")
    void fiscalYearPeriodChecks() {
        FiscalYear fy = FiscalYear.builder()
                .tenant(tenant).year(2026)
                .summerSelfOpen(true).summerEvalOpen(false)
                .winterSelfOpen(false).winterEvalOpen(true)
                .build();

        assertThat(fy.isSelfEvaluationOpen("SUMMER")).isTrue();
        assertThat(fy.isSelfEvaluationOpen("WINTER")).isFalse();
        assertThat(fy.isEvaluationOpen("SUMMER")).isFalse();
        assertThat(fy.isEvaluationOpen("WINTER")).isTrue();
    }

    private Evaluation eval(EvaluationStatus status) {
        return Evaluation.builder().status(status).build();
    }
}
