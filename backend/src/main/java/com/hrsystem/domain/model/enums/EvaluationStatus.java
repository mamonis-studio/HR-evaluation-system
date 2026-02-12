package com.hrsystem.domain.model.enums;

public enum EvaluationStatus {
    NOT_STARTED("未開始"),
    SELF_SUBMITTED("自己評価提出済"),
    EVALUATOR_SUBMITTED("評価者評価済"),
    MANAGER_APPROVED("管理者確認済"),
    DIRECTOR_EVALUATED("役員評価済"),
    FINALIZED("最終確定");

    private final String label;

    EvaluationStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
