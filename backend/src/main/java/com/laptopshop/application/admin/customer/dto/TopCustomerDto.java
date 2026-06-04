package com.laptopshop.application.admin.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Top khách hàng theo doanh thu — "Khách hàng hot".
 */
@Getter
@AllArgsConstructor
public class TopCustomerDto {
    private Long id;
    private String name;
    private String email;
    /** Tổng chi tiêu VND trong kỳ */
    private BigDecimal revenue;
    private Integer totalOrders;
    /** revenue / totalOrders */
    private BigDecimal avgOrderValue;
}