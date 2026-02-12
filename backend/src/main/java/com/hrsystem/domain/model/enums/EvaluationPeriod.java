package com.hrsystem.domain.model.enums;

public enum EvaluationPeriod {
    SUMMER("夏評価"),
    WINTER("冬評価");

    private final String label;

    EvaluationPeriod(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
