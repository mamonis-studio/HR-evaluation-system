package com.hrsystem.security;

/**
 * リクエストスコープでテナントIDを保持するコンテキスト。
 * SecurityFilter で認証時にセットし、Service層でテナント分離に使用。
 */
public class TenantContext {

    private static final ThreadLocal<Long> currentTenantId = new ThreadLocal<>();

    public static void setTenantId(Long tenantId) {
        currentTenantId.set(tenantId);
    }

    public static Long getTenantId() {
        return currentTenantId.get();
    }

    public static void clear() {
        currentTenantId.remove();
    }
}
