package com.laptopshop.application.admin.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Tóm tắt một đơn hàng trong lịch sử khách hàng.
 * paymentMethod: lấy từ payments.method (PaymentMethod enum → toString).
 * status: DB enum string (PENDING/CONFIRMED/PROCESSING/SHIPPING/DELIVERED/COMPLETED/CANCELLED/REFUNDED).
 */
@Getter
@AllArgsConstructor
public class OrderSummaryDto {
    private String orderCode;
    private BigDecimal totalAmount;
    /** PaymentMethod enum name, ví dụ: "COD", "VNPAY", "MOMO" — null nếu chưa có payment */
    private String paymentMethod;
    private String status;
    private LocalDateTime orderedAt;
}
