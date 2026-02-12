package com.hrsystem.domain.model.enums;

public enum Grade {
    SS, S, A_PLUS("A+"), A, B, C, D;

    private final String display;

    Grade() {
        this.display = name();
    }

    Grade(String display) {
        this.display = display;
    }

    public String getDisplay() {
        return display;
    }
}
