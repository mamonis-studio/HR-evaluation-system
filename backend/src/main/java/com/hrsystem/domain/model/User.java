package com.hrsystem.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "email"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private Position position;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "name_kana", length = 100)
    private String nameKana;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "can_evaluate", nullable = false)
    @Builder.Default
    private Boolean canEvaluate = false;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ===== 権限判定メソッド =====

    public boolean canViewAll() {
        return position != null && position.getCanViewAll();
    }

    public boolean canPerformEvaluation() {
        return (position != null && position.getCanEvaluate()) || canEvaluate;
    }

    public boolean canFinalApprove() {
        return position != null && position.getCanFinalApprove();
    }

    public boolean isManager() {
        return position != null && position.getCode() == 2;
    }

    public boolean isDirector() {
        return position != null && position.getCode() == 1;
    }

    public boolean isSystemAdmin() {
        return position != null && position.getCode() == 0;
    }

    public boolean isSeniorStaff() {
        return position != null && position.getCode() <= 2;
    }
}
