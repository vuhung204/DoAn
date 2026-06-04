package com.laptopshop.application.admin.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class OrderItemDto {
    private Long       itemId;
    private Long       productId;
    private String     sku;
    private String     name;
    private Integer    quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}
