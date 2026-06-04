package com.laptopshop.application.customer.payment.service;

import com.laptopshop.application.customer.notification.service.NotificationService;
import com.laptopshop.application.customer.payment.dto.PaymentRequest;
import com.laptopshop.application.customer.payment.dto.PaymentResponse;
import com.laptopshop.domain.order.entity.Order;
import com.laptopshop.domain.order.entity.Payment;
import com.laptopshop.domain.order.enums.OrderStatus;
import com.laptopshop.domain.order.enums.PaymentMethod;
import com.laptopshop.domain.order.enums.PaymentStatus;
import com.laptopshop.domain.order.repository.OrderRepository;
import com.laptopshop.domain.order.repository.PaymentRepository;
import com.laptopshop.infrastructure.payment.MoMoUtils;
import com.laptopshop.infrastructure.payment.VNPayUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository   paymentRepository;
    private final OrderRepository     orderRepository;
    private final VNPayUtils          vnPayUtils;
    private final MoMoUtils           moMoUtils;
    private final NotificationService notificationService;

    @Transactional
    public PaymentResponse createPayment(Long userId, PaymentRequest request) throws Exception {
        Order order = orderRepository.findByIdAndUserId(request.getOrderId(), userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thanh toán cho đơn hàng"));

        if (payment.getStatus() != PaymentStatus.PENDING
                && payment.getStatus() != PaymentStatus.FAILED) {
            throw new RuntimeException("Đơn hàng đã được thanh toán");
        }

        PaymentMethod requested = PaymentMethod.valueOf(request.getMethod().toUpperCase());
        if (payment.getMethod() != requested) {
            throw new RuntimeException("Phương thức thanh toán không khớp với đơn hàng");
        }

        switch (payment.getMethod()) {
            case COD -> {
                payment.setStatus(PaymentStatus.PENDING);
                order.setStatus(OrderStatus.CONFIRMED);
                orderRepository.save(order);
            }
            case VNPAY, CREDIT_CARD -> {
                String url = vnPayUtils.createPaymentUrl(
                        order.getId(),
                        order.getTotalAmount().longValue(),
                        "Thanh toan don hang " + order.getOrderCode()
                );
                payment.setPaymentUrl(url);
            }
            case MOMO -> {
                String url = moMoUtils.createPaymentUrl(
                        order.getId(),
                        order.getTotalAmount().longValue(),
                        "Thanh toan don hang " + order.getOrderCode()
                );
                payment.setPaymentUrl(url);
            }
            case BANK_TRANSFER -> {
                payment.setStatus(PaymentStatus.PENDING);
            }
            case ZALOPAY -> {
                throw new RuntimeException("ZaloPay chưa được kích hoạt. Vui lòng chọn phương thức khác.");
            }
        }

        paymentRepository.save(payment);
        return PaymentResponse.from(payment);
    }

    @Transactional
    public void handleVNPayCallback(Map<String, String> params) {
        if (!vnPayUtils.verifyCallback(new HashMap<>(params))) {
            throw new RuntimeException("Chữ ký không hợp lệ");
        }

        String vnpTxnRef     = params.get("vnp_TxnRef");
        String responseCode  = params.get("vnp_ResponseCode");
        String transactionId = params.get("vnp_TransactionNo");

        String idPart  = vnpTxnRef.contains("_") ? vnpTxnRef.split("_")[0] : vnpTxnRef;
        Long   orderId = Long.parseLong(idPart);

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy payment"));

        payment.setTransactionId(transactionId);
        payment.setRawResponse(params.toString());

        Order order = payment.getOrder();

        if ("00".equals(responseCode)) {
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaidAt(LocalDateTime.now());
            order.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);
            paymentRepository.save(payment);

            notificationService.pushPaymentSuccess(
                    order.getUser().getId(),
                    order.getId(),
                    order.getOrderCode(),
                    payment.getAmount().longValue()
            );
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);

            notificationService.pushPaymentFailed(
                    order.getUser().getId(),
                    order.getId(),
                    order.getOrderCode()
            );

            throw new RuntimeException("Thanh toán thất bại, mã lỗi: " + responseCode);
        }
    }

    @Transactional
    public void handleMoMoCallback(Map<String, String> params) {
        if (!moMoUtils.verifyCallback(params)) {
            throw new RuntimeException("Chữ ký không hợp lệ");
        }

        String orderId_   = params.get("orderId");
        Long   orderId    = Long.parseLong(orderId_.replace("ORDER_", ""));
        String resultCode = params.get("resultCode");
        String transId    = params.get("transId");

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy payment"));

        payment.setTransactionId(transId);
        payment.setRawResponse(params.toString());

        Order order = payment.getOrder();

        if ("0".equals(resultCode)) {
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaidAt(LocalDateTime.now());
            order.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);

            notificationService.pushPaymentSuccess(
                    order.getUser().getId(),
                    order.getId(),
                    order.getOrderCode(),
                    payment.getAmount().longValue()
            );
        } else {
            payment.setStatus(PaymentStatus.FAILED);

            notificationService.pushPaymentFailed(
                    order.getUser().getId(),
                    order.getId(),
                    order.getOrderCode()
            );
        }

        paymentRepository.save(payment);
    }

    public PaymentResponse getPaymentByOrder(Long userId, Long orderId) {
        orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        return paymentRepository.findByOrderId(orderId)
                .map(PaymentResponse::from)
                .orElseThrow(() -> new RuntimeException("Chưa có thông tin thanh toán"));
    }
}