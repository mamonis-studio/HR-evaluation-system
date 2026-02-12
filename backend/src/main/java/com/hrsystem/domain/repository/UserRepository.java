package com.hrsystem.domain.repository;

import com.hrsystem.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByTenantIdAndEmail(Long tenantId, String email);

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.isActive = true")
    Optional<User> findActiveByEmail(@Param("email") String email);

    List<User> findByTenantIdAndIsActiveTrue(Long tenantId);

    @Query("SELECT u FROM User u JOIN u.position p " +
           "WHERE u.tenant.id = :tenantId AND u.department.id = :departmentId " +
           "AND u.isActive = true AND p.code > 2 " +
           "ORDER BY p.sortOrder, u.name")
    List<User> findDepartmentStaff(@Param("tenantId") Long tenantId,
                                   @Param("departmentId") Long departmentId);

    @Query("SELECT u FROM User u JOIN u.position p " +
           "WHERE u.tenant.id = :tenantId AND u.department.id = :departmentId " +
           "AND u.isActive = true AND (p.canEvaluate = true OR u.canEvaluate = true) " +
           "ORDER BY p.sortOrder, u.name")
    List<User> findEvaluatorCandidates(@Param("tenantId") Long tenantId,
                                       @Param("departmentId") Long departmentId);

    @Query("SELECT u FROM User u JOIN u.position p " +
           "WHERE u.tenant.id = :tenantId AND p.code IN (0, 1) AND u.isActive = true")
    List<User> findDirectorsAndAdmins(@Param("tenantId") Long tenantId);
}
