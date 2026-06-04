package com.laptopshop.application.admin.productreport.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Phân bổ doanh thu / số lượng bán theo danh mục sản phẩm.
 */
@Getter
@AllArgsConstructor
public class CategoryBreakdownDto {
    private Long categoryId;
    private String categoryName;
    /** Doanh thu VND */
    private BigDecimal revenue;
    /** Tổng số lượng đã bán */
    private Long unitsSold;
    /**
     * Tỷ trọng doanh thu trong tổng (%).
     * = revenue / totalRevenue * 100, scale = 2.
     */
    private BigDecimal sharePercent;
    /** Màu hex cho chart (optional, null nếu không cấu hình) */
    private String color;
}
