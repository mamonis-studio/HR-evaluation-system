package com.hrsystem.domain.repository;

import com.hrsystem.domain.model.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GoalRepository extends JpaRepository<Goal, Long> {

    List<Goal> findByTenantIdAndUserIdAndFiscalYearIdOrderBySortOrder(
            Long tenantId, Long userId, Long fiscalYearId);

    void deleteByTenantIdAndUserIdAndFiscalYearId(Long tenantId, Long userId, Long fiscalYearId);
}
