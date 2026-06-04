package com.laptopshop.application.customer.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    /**
     * Gửi OTP quên mật khẩu — async để không block request.
     */
    @Async
    public void sendForgotPasswordOtp(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("[LaptopShop] Mã xác nhận đặt lại mật khẩu");
            helper.setText(buildOtpEmailHtml(otp), true);

            mailSender.send(message);
        } catch (Exception e) {
            // Log lỗi nhưng không throw — tránh leak thông tin email
            System.err.println("Lỗi gửi email OTP tới " + toEmail + ": " + e.getMessage());
        }
    }

    private String buildOtpEmailHtml(String otp) {
        return """
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
              <div style="background: #dc2626; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🔐 LaptopShop</h1>
              </div>
              <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                <h2 style="color: #111827; margin-top: 0;">Đặt lại mật khẩu</h2>
                <p style="color: #6b7280;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                <p style="color: #6b7280;">Mã xác nhận OTP của bạn là:</p>
                <div style="background: #fef2f2; border: 2px dashed #dc2626; border-radius: 8px;
                            padding: 20px; text-align: center; margin: 24px 0;">
                  <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #dc2626;">
                    %s
                  </span>
                </div>
                <p style="color: #6b7280; font-size: 14px;">
                  ⏰ Mã có hiệu lực trong <strong>10 phút</strong>.<br/>
                  Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
                </p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  © 2025 LaptopShop. Không trả lời email này.
                </p>
              </div>
            </div>
            """.formatted(otp);
    }
}
