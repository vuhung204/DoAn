package com.laptopshop.application.admin.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * DTO cho danh sách đơn hàng — field names khớp với FE mapping.
 * FE dùng: o.orderCode, o.customerName, o.storeName, o.totalAmount,
 *           o.paymentMethod, o.payStatus, o.status, o.orderedAt (string)
 */
@Getter
@AllArgsConstructor
public class OrderListDto {
    private Long       orderId;
    private String     orderCode;
    private String     customerName;
    private String     customerPhone;
    private String     customerEmail;
    private String     storeName;        // FE: order.branch = o.storeName
    private BigDecimal totalAmount;
    private int        itemCount;
    private String     paymentMethod;    // FE: order.payment
    private String     payStatus;        // FE: order.payStatus
    private String     status;           // frontend string: "pending","done"...
    private String     orderedAt;        // FE cần string "2026-04-05 10:30"
}

