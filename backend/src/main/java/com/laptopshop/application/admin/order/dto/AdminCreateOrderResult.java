package com.laptopshop.application.admin.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Kết quả trả về khi admin tạo đơn hàng tại quầy.
 * Tái dùng OrderDetailDto nếu muốn, nhưng giữ riêng để dễ mở rộng.
 */
@Getter
@AllArgsConstructor
public class AdminCreateOrderResult {

    private Long    orderId;
    private String  orderCode;

    /** "walk_in" | "registered" */
    private String  customerType;

    private String  customerName;
    private String  customerPhone;
    private String  storeName;

    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;

    private String  paymentMethod;
    private String  status;
    private String  note;
    private String  orderedAt;
}
