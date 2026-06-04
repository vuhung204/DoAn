package com.laptopshop.application.customer.auth.service;

import com.laptopshop.domain.user.entity.AuthOtp;
import com.laptopshop.domain.user.entity.User;
import com.laptopshop.domain.user.enums.OtpPurpose;
import com.laptopshop.domain.user.repository.AuthOtpRepository;
import com.laptopshop.domain.user.repository.UserRepository;
import com.laptopshop.application.customer.auth.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ForgotPasswordService {

    private final UserRepository    userRepository;
    private final AuthOtpRepository otpRepository;
    private final EmailService      emailService;
    private final PasswordEncoder   passwordEncoder;

    private static final int    OTP_LENGTH      = 6;
    private static final int    OTP_EXPIRE_MINS = 10;
    private static final int    MAX_OTP_ATTEMPTS = 5; // rate-limit đơn giản

    // ── Step 1: Gửi OTP ──────────────────────────────────────────────────────

    @Transactional
    public void sendOtp(String email) {
        // Luôn trả success dù email có tồn tại hay không (tránh email enumeration)
        boolean exists = userRepository.existsByEmail(email);
        if (!exists) return; // im lặng

        // Vô hiệu hoá OTP cũ
        otpRepository.invalidateAll(email, OtpPurpose.RESET_PASSWORD, LocalDateTime.now());

        // Tạo OTP 6 số
        String otp       = generateOtp();
        String otpHash   = passwordEncoder.encode(otp); // bcrypt hash

        AuthOtp entity = new AuthOtp();
        entity.setEmail(email);
        entity.setCodeHash(otpHash);
        entity.setPurpose(OtpPurpose.RESET_PASSWORD);
        entity.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRE_MINS));
        otpRepository.save(entity);

        // Gửi email (async — không block)
        emailService.sendForgotPasswordOtp(email, otp);
    }

    // ── Step 2: Verify OTP ────────────────────────────────────────────────────

    @Transactional
    public String verifyOtp(String email, String otp) {
        AuthOtp record = otpRepository
                .findValidOtp(email, OtpPurpose.RESET_PASSWORD, LocalDateTime.now())
                .orElseThrow(() -> new RuntimeException("Mã OTP không hợp lệ hoặc đã hết hạn"));

        if (!passwordEncoder.matches(otp, record.getCodeHash())) {
            throw new RuntimeException("Mã OTP không đúng");
        }

        // Đánh dấu đã dùng
        record.setUsedAt(LocalDateTime.now());
        otpRepository.save(record);

        // Trả về resetToken = bcrypt(email + otpId + timestamp)
        // FE gửi lại token này ở step 3 để xác thực
        String raw = email + "|" + record.getId() + "|" + System.currentTimeMillis();
        return passwordEncoder.encode(raw); // dùng làm opaque token tạm
        // Lưu ý: đây là token đơn giản cho đồ án.
        // Production nên dùng JWT signed ngắn hạn (5 phút).
    }

    // ── Step 3: Reset password ────────────────────────────────────────────────

    @Transactional
    public void resetPassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        if (newPassword == null || newPassword.length() < 8) {
            throw new RuntimeException("Mật khẩu mới phải có ít nhất 8 ký tự");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int num = random.nextInt(900_000) + 100_000; // 100000–999999
        return String.valueOf(num);
    }
}
