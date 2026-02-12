package com.hrsystem.controller;

import com.hrsystem.domain.model.User;
import com.hrsystem.domain.repository.UserRepository;
import com.hrsystem.security.JwtTokenProvider;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            UserInfo user
    ) {}

    public record UserInfo(
            Long id,
            String name,
            String email,
            String positionName,
            String departmentName,
            boolean canEvaluate,
            boolean canViewAll,
            boolean canFinalApprove
    ) {}

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findActiveByEmail(request.email())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "メールアドレスまたはパスワードが正しくありません"));
        }

        // 最終ログイン更新
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getTenant().getId(), user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        UserInfo userInfo = new UserInfo(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPosition() != null ? user.getPosition().getName() : null,
                user.getDepartment() != null ? user.getDepartment().getName() : null,
                user.canPerformEvaluation(),
                user.canViewAll(),
                user.canFinalApprove()
        );

        return ResponseEntity.ok(new AuthResponse(accessToken, refreshToken, userInfo));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");

        if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken)) {
            return ResponseEntity.status(401).body(Map.of("error", "無効なリフレッシュトークンです"));
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId).orElse(null);

        if (user == null || !user.getIsActive()) {
            return ResponseEntity.status(401).body(Map.of("error", "ユーザーが無効です"));
        }

        String newAccessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getTenant().getId(), user.getEmail());

        return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
    }
}
