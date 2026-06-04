package com.laptopshop.application.admin.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Doanh thu theo chi nhánh (store).
 * Dùng cho bar chart / table branch revenue trên Dashboard.
 */
@Getter
@AllArgsConstructor
public class BranchRevenueDto {
    private Long storeId;
    private String storeName;
    /** Doanh thu (VND) trong khoảng thời gian được chọn */
    private BigDecimal revenue;
}

