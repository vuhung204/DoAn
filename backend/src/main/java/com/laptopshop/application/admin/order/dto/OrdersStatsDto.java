package com.laptopshop.application.admin.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Flat structure — FE truy cập trực tiếp stats.pending, stats.done...
 */
@Getter
@AllArgsConstructor
public class OrdersStatsDto {
    private long       total;
    private long       pending;
    private long       confirmed;
    private long       processing;
    private long       shipping;
    private long       done;
    private long       cancelled;
    private long       refunded;
    private BigDecimal totalRevenue;
}
