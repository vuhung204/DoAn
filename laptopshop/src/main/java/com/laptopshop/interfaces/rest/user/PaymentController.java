package com.laptopshop.interfaces.rest.user;

import com.laptopshop.application.customer.payment.dto.PaymentRequest;
import com.laptopshop.application.customer.payment.dto.PaymentResponse;
import com.laptopshop.application.customer.payment.service.PaymentService;
import com.laptopshop.domain.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;
    private final UserRepository userRepository;

    private Long getUserId(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"))
                .getId();
    }

    // POST /api/payment — tạo payment cho đơn hàng
    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(
            Authentication auth,
            @RequestBody PaymentRequest request) throws Exception {
        return ResponseEntity.ok(paymentService.createPayment(getUserId(auth), request));
    }

    // GET /api/payment/order/{orderId} — xem trạng thái payment
    @GetMapping("/order/{orderId}")
    public ResponseEntity<PaymentResponse> getPayment(
            Authentication auth,
            @PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.getPaymentByOrder(getUserId(auth), orderId));
    }

    @GetMapping("/vnpay/callback")
    public void vnpayCallback(
            @RequestParam Map<String, String> params,
            HttpServletResponse response) throws IOException {

        // 🔍 Log toàn bộ params để xem responseCode thực tế
        System.out.println("=== VNPAY CALLBACK PARAMS ===");
        params.forEach((k, v) -> System.out.println(k + " = " + v));
        System.out.println("=============================");

        String orderId = "0";
        try {
            String txnRef = params.getOrDefault("vnp_TxnRef", "0");
            orderId = txnRef.contains("_") ? txnRef.split("_")[0] : txnRef;

            paymentService.handleVNPayCallback(params);

            response.sendRedirect("http://localhost:5173/order-success?orderId=" + orderId);

        } catch (Exception e) {
            System.out.println("=== VNPAY CALLBACK ERROR: " + e.getMessage() + " ===");
            response.sendRedirect("http://localhost:5173/order-failed?orderId=" + orderId);
        }
    }

    // POST /api/payment/momo/callback — MoMo gọi về (IPN)
    @PostMapping("/momo/callback")
    public ResponseEntity<String> momoCallback(@RequestBody Map<String, String> params) {
        paymentService.handleMoMoCallback(params);
        return ResponseEntity.ok("OK");
    }

    // POST /api/payment/momo/notify — MoMo notify
    @PostMapping("/momo/notify")
    public ResponseEntity<String> momoNotify(@RequestBody Map<String, String> params) {
        paymentService.handleMoMoCallback(params);
        return ResponseEntity.ok("OK");
    }
}
