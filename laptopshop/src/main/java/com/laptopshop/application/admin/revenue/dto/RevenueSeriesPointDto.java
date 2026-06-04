package com.laptopshop.application.admin.revenue.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Một row trong time-series doanh thu.
 * Shape: (timeLabel, storeId, storeKey, revenue).
 *
 * Frontend pivot:
 *   rows → Map<label, Map<storeKey, revenue>> để vẽ multi-line chart.
 *
 * Nếu storeId = null → row tổng hợp (all-stores mode).
 */
@Getter
@AllArgsConstructor
public class RevenueSeriesPointDto {
    /**
     * Label thời gian hiển thị:
     *  day mode   → "25/03"
     *  month mode → "T3/2026"
     *  year mode  → "2026"
     */
    private String label;

    /** null nếu query không filter theo store */
    private Long storeId;

    /**
     * Frontend key của branch, ví dụ: "hk", "cg".
     * Được resolve từ store.name (slug hoặc viết tắt).
     * null nếu không filter theo store.
     */
    private String storeKey;

    /** Doanh thu VND */
    private BigDecimal revenue;
}
