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
    private String     storeName;
    private BigDecimal totalAmount;
    private int        itemCount;
    private String     paymentMethod;
    private String     payStatus;
    private String     status;
    private String     orderedAt;
}

