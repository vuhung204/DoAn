package com.laptopshop.application.admin.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * KPI cards cho CustomerStats section.
 */
@Getter
@AllArgsConstructor
public class CustomerStatsSummaryDto {
    /** Tổng khách hàng trong hệ thống */
    private Long totalCustomers;
    /** Khách hàng mới trong period */
    private Long newCustomers;
    /**
     * Khách hàng "hot" = top spender trong period
     * (đếm số khách có tổng chi tiêu > ngưỡng hoặc có ≥ N đơn)
     */
    private Long hotCustomers;
    /** Tài khoản bị khoá (status = LOCKED) */
    private Long lockedAccounts;

    // Formatted strings tiện cho UI (optional)
    private String totalCustomersFormatted;
    private String newCustomersFormatted;
}
