package com.hrsystem.domain.repository;

import com.hrsystem.domain.model.Evaluation;
import com.hrsystem.domain.model.enums.EvaluationPeriod;
import com.hrsystem.domain.model.enums.EvaluationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {

    Optional<Evaluation> findByTenantIdAndUserIdAndFiscalYearIdAndPeriod(
            Long tenantId, Long userId, Long fiscalYearId, EvaluationPeriod period);

    List<Evaluation> findByTenantIdAndUserIdOrderByFiscalYearDesc(
            Long tenantId, Long userId);

    // 評価者に割り当てられた未評価一覧
    List<Evaluation> findByTenantIdAndEvaluatorIdAndStatus(
            Long tenantId, Long evaluatorId, EvaluationStatus status);

    // 管理者確認待ち
    List<Evaluation> findByTenantIdAndDepartmentIdAndStatus(
            Long tenantId, Long departmentId, EvaluationStatus status);

    // 役員評価待ち
    List<Evaluation> findByTenantIdAndStatus(Long tenantId, EvaluationStatus status);

    // カウント系
    @Query("SELECT COUNT(e) FROM Evaluation e WHERE e.tenant.id = :tenantId " +
           "AND e.evaluator.id = :evaluatorId AND e.status = :status")
    long countPendingForEvaluator(@Param("tenantId") Long tenantId,
                                  @Param("evaluatorId") Long evaluatorId,
                                  @Param("status") EvaluationStatus status);

    @Query("SELECT COUNT(e) FROM Evaluation e WHERE e.tenant.id = :tenantId " +
           "AND e.department.id = :departmentId AND e.status = :status")
    long countPendingForDepartment(@Param("tenantId") Long tenantId,
                                   @Param("departmentId") Long departmentId,
                                   @Param("status") EvaluationStatus status);

    @Query("SELECT COUNT(e) FROM Evaluation e WHERE e.tenant.id = :tenantId AND e.status = :status")
    long countByTenantAndStatus(@Param("tenantId") Long tenantId,
                                @Param("status") EvaluationStatus status);
}
