package com.laptopshop.application.admin.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class RefundDto {
    private Long          returnId;
    private Long          orderId;
    private BigDecimal    refundAmount;
    private String        status;
    private String        reason;
    private LocalDateTime requestedAt;
}
