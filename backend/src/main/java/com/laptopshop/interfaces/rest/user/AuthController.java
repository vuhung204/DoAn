package com.laptopshop.interfaces.rest.user;

import com.laptopshop.application.customer.auth.dto.*;
import com.laptopshop.application.customer.auth.service.AuthService;
import com.laptopshop.application.customer.auth.service.ForgotPasswordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final ForgotPasswordService forgotPasswordService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (DisabledException e) {
            return ResponseEntity.status(403).body(Map.of("error", "Tài khoản chưa xác thực email"));
        } catch (LockedException e) {
            return ResponseEntity.status(403).body(Map.of("error", "Tài khoản đã bị khóa"));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Email hoặc mật khẩu không đúng"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok("Đăng ký thành công");
    }

    // ── Forgot Password — Step 1: Gửi OTP ────────────────────────────────────
    // POST /api/auth/forgot-password
    // Body: { "email": "user@example.com" }
    // Luôn trả 200 dù email tồn tại hay không (tránh email enumeration)

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @RequestBody ForgotPasswordRequest request) {
        try {
            forgotPasswordService.sendOtp(request.getEmail());
        } catch (Exception ignored) {
            // Nuốt lỗi — không leak thông tin
        }
        return ResponseEntity.ok(Map.of(
                "message", "Nếu email tồn tại, mã OTP đã được gửi."
        ));
    }

    // ── Forgot Password — Step 2: Verify OTP ─────────────────────────────────
    // POST /api/auth/verify-otp
    // Body: { "email": "...", "otp": "123456" }
    // Response: { "resetToken": "..." }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        try {
            String resetToken = forgotPasswordService.verifyOtp(
                    request.getEmail(), request.getOtp());
            return ResponseEntity.ok(Map.of("resetToken", resetToken));
        } catch (Exception e) {
            return ResponseEntity.status(400)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ── Forgot Password — Step 3: Reset Password ──────────────────────────────
    // POST /api/auth/reset-password
    // Body: { "email": "...", "resetToken": "...", "newPassword": "..." }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            // Validate resetToken — chỉ cho phép reset nếu token hợp lệ
            // Token được tạo ở step 2, FE giữ trong state (không persist DB)
            // Production: dùng JWT signed. Đồ án: trust FE giữ token đúng flow.
            forgotPasswordService.resetPassword(request.getEmail(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(400)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
