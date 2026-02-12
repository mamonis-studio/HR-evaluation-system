package com.hrsystem.domain.model.enums;

public enum TenantPlan {
    FREE(10),
    STARTER(50),
    PROFESSIONAL(200),
    ENTERPRISE(Integer.MAX_VALUE);

    private final int maxUsers;

    TenantPlan(int maxUsers) {
        this.maxUsers = maxUsers;
    }

    public int getMaxUsers() {
        return maxUsers;
    }
}
