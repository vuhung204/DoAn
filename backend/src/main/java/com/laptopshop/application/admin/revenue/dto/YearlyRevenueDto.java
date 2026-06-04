package com.laptopshop.application.admin.revenue.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Doanh thu theo năm — YearlyBarChart.
 */
@Getter
@AllArgsConstructor
public class YearlyRevenueDto {
    private int year;
    /** Doanh thu VND */
    private BigDecimal revenue;
    /** Ghi chú tuỳ chọn, ví dụ: "Năm COVID" — null nếu không có */
    private String note;
}

