package com.laptopshop.application.admin.revenue.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Doanh thu một chi nhánh trong khoảng thời gian.
 * Dùng cho BranchRevenueTable và bar chart.
 */
@Getter
@AllArgsConstructor
public class BranchRevenueDto {
    private Long storeId;
    /** Short key dùng ở frontend, ví dụ: "hk", "cg" — derive từ store name slug */
    private String storeKey;
    private String storeName;
    /** Doanh thu VND */
    private BigDecimal revenue;
}

