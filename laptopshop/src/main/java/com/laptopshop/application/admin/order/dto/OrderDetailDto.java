package com.laptopshop.application.admin.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

/**
 * Chi tiết đơn hàng trả về cho FE.
 * orderedAt là String "yyyy-MM-dd HH:mm" để FE hiển thị trực tiếp.
 */
@Getter
@AllArgsConstructor
public class OrderDetailDto {
    private Long              orderId;
    private String            orderCode;
    private Long              userId;
    private CustomerDto       customer;
    private AddressDto        shippingAddress;
    private String            branchName;
    private String            paymentMethod;
    private String            payStatus;
    private String            status;           // frontend string
    private BigDecimal        subtotal;
    private BigDecimal        discountAmount;
    private BigDecimal        shippingFee;
    private BigDecimal        totalAmount;
    private String            note;
    private String            orderedAt;        // String thay vì LocalDateTime
    private List<OrderItemDto>     items;
    private List<OrderHistoryDto>  history;
}
