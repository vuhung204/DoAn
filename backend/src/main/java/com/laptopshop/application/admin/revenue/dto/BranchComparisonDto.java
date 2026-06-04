package com.laptopshop.application.admin.revenue.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Dữ liệu so sánh 2 kỳ cho một chi nhánh — BranchComparisonTable.
 */
@Getter
@AllArgsConstructor
public class BranchComparisonDto {
    private Long storeId;
    private String storeKey;
    private String storeName;

    /** Doanh thu kỳ hiện tại (VND) */
    private BigDecimal curRevenue;

    /** Doanh thu kỳ trước (VND) */
    private BigDecimal prevRevenue;

    /**
     * Tăng trưởng (%): (cur - prev) / prev * 100.
     * null nếu prev = 0.
     */
    private BigDecimal growthPercent;

    /**
     * Tỷ trọng doanh thu chi nhánh trong tổng kỳ hiện tại (%).
     * = curRevenue / totalCurRevenue * 100
     */
    private BigDecimal sharePercent;
}
