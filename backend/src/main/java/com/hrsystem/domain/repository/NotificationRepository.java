package com.hrsystem.domain.repository;

import com.hrsystem.domain.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByTenantIdAndUserIdOrderByCreatedAtDesc(Long tenantId, Long userId);

    long countByTenantIdAndUserIdAndIsReadFalse(Long tenantId, Long userId);
}
