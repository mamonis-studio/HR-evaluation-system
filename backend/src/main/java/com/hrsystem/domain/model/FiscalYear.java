package com.hrsystem.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fiscal_years", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "year"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class FiscalYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "is_current", nullable = false)
    @Builder.Default
    private Boolean isCurrent = false;

    @Column(name = "goal_setting_open", nullable = false)
    @Builder.Default
    private Boolean goalSettingOpen = false;

    @Column(name = "summer_self_open", nullable = false)
    @Builder.Default
    private Boolean summerSelfOpen = false;

    @Column(name = "summer_eval_open", nullable = false)
    @Builder.Default
    private Boolean summerEvalOpen = false;

    @Column(name = "winter_self_open", nullable = false)
    @Builder.Default
    private Boolean winterSelfOpen = false;

    @Column(name = "winter_eval_open", nullable = false)
    @Builder.Default
    private Boolean winterEvalOpen = false;

    @Column(name = "summer_start_date")
    private LocalDate summerStartDate;

    @Column(name = "summer_end_date")
    private LocalDate summerEndDate;

    @Column(name = "winter_start_date")
    private LocalDate winterStartDate;

    @Column(name = "winter_end_date")
    private LocalDate winterEndDate;

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

    public boolean isSelfEvaluationOpen(String period) {
        return "SUMMER".equalsIgnoreCase(period) ? summerSelfOpen : winterSelfOpen;
    }

    public boolean isEvaluationOpen(String period) {
        return "SUMMER".equalsIgnoreCase(period) ? summerEvalOpen : winterEvalOpen;
    }
}
