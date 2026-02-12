package com.hrsystem.domain.model;

import com.hrsystem.domain.model.enums.EvaluationPeriod;
import com.hrsystem.domain.model.enums.EvaluationStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluations", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "user_id", "fiscal_year_id", "period"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Evaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fiscal_year_id", nullable = false)
    private FiscalYear fiscalYear;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EvaluationPeriod period;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private Position position;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EvaluationStatus status = EvaluationStatus.NOT_STARTED;

    // ===== 評価者 =====
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluator_id")
    private User evaluator;

    @Column(name = "evaluator_grade", length = 10)
    private String evaluatorGrade;

    @Column(name = "evaluator_comment", columnDefinition = "TEXT")
    private String evaluatorComment;

    @Column(name = "evaluated_at")
    private LocalDateTime evaluatedAt;

    // ===== 管理者（施設長相当） =====
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @Column(name = "manager_grade", length = 10)
    private String managerGrade;

    @Column(name = "manager_comment", columnDefinition = "TEXT")
    private String managerComment;

    @Column(name = "manager_approved_at")
    private LocalDateTime managerApprovedAt;

    // ===== 役員（理事長相当） =====
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "director_id")
    private User director;

    @Column(name = "director_grade", length = 10)
    private String directorGrade;

    @Column(name = "director_comment", columnDefinition = "TEXT")
    private String directorComment;

    @Column(name = "director_evaluated_at")
    private LocalDateTime directorEvaluatedAt;

    @Column(name = "finalized_at")
    private LocalDateTime finalizedAt;

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

    // ===== ワークフロー判定 =====

    public boolean canSelfEvaluate() {
        return status == EvaluationStatus.NOT_STARTED;
    }

    public boolean canEvaluatorSubmit() {
        return status == EvaluationStatus.SELF_SUBMITTED;
    }

    public boolean canManagerApprove() {
        return status == EvaluationStatus.EVALUATOR_SUBMITTED;
    }

    public boolean canDirectorEvaluate() {
        return status == EvaluationStatus.MANAGER_APPROVED;
    }

    public boolean canFinalize() {
        return status == EvaluationStatus.DIRECTOR_EVALUATED;
    }
}
