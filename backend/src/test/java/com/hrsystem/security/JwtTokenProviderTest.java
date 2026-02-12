package com.hrsystem.security;

import org.junit.jupiter.api.*;
import io.jsonwebtoken.Claims;

import static org.assertj.core.api.Assertions.*;

/**
 * JwtTokenProvider の単体テスト。
 * トークン生成・検証・クレーム取得を検証する。
 */
class JwtTokenProviderTest {

    private JwtTokenProvider provider;

    // テスト用256bit以上の秘密鍵
    private static final String SECRET = "test-secret-key-that-is-long-enough-for-256-bits-hmac";

    @BeforeEach
    void setUp() {
        provider = new JwtTokenProvider(SECRET, 900_000, 604_800_000);
    }

    @Test
    @DisplayName("アクセストークンの生成と検証")
    void generateAndValidateAccessToken() {
        String token = provider.generateAccessToken(1L, 10L, "user@test.com");

        assertThat(token).isNotBlank();
        assertThat(provider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("トークンからユーザーIDを取得")
    void getUserIdFromToken() {
        String token = provider.generateAccessToken(42L, 10L, "user@test.com");

        Long userId = provider.getUserIdFromToken(token);

        assertThat(userId).isEqualTo(42L);
    }

    @Test
    @DisplayName("トークンからテナントIDを取得")
    void getTenantIdFromToken() {
        String token = provider.generateAccessToken(1L, 99L, "user@test.com");

        Long tenantId = provider.getTenantIdFromToken(token);

        assertThat(tenantId).isEqualTo(99L);
    }

    @Test
    @DisplayName("トークンのクレームにemailが含まれる")
    void tokenContainsEmailClaim() {
        String token = provider.generateAccessToken(1L, 10L, "admin@example.com");

        Claims claims = provider.parseToken(token);

        assertThat(claims.get("email", String.class)).isEqualTo("admin@example.com");
    }

    @Test
    @DisplayName("リフレッシュトークンの生成と検証")
    void generateAndValidateRefreshToken() {
        String token = provider.generateRefreshToken(1L);

        assertThat(token).isNotBlank();
        assertThat(provider.validateToken(token)).isTrue();
        assertThat(provider.getUserIdFromToken(token)).isEqualTo(1L);
    }

    @Test
    @DisplayName("不正なトークンはバリデーション失敗")
    void invalidTokenFails() {
        assertThat(provider.validateToken("invalid.token.here")).isFalse();
        assertThat(provider.validateToken("")).isFalse();
        assertThat(provider.validateToken(null)).isFalse();
    }

    @Test
    @DisplayName("異なる秘密鍵で生成されたトークンは検証失敗")
    void differentSecretFails() {
        JwtTokenProvider otherProvider = new JwtTokenProvider(
                "completely-different-secret-key-for-testing-purposes", 900_000, 604_800_000);

        String token = otherProvider.generateAccessToken(1L, 10L, "user@test.com");

        assertThat(provider.validateToken(token)).isFalse();
    }

    @Test
    @DisplayName("アクセストークンとリフレッシュトークンは異なる値")
    void accessAndRefreshTokensAreDifferent() {
        String access = provider.generateAccessToken(1L, 10L, "user@test.com");
        String refresh = provider.generateRefreshToken(1L);

        assertThat(access).isNotEqualTo(refresh);
    }
}
