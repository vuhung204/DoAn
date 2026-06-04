package com.laptopshop.application.admin.productreport.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Một sản phẩm bán chạy nhất — TopProductsTable.
 * revenue trả BigDecimal VND; frontend format sang "Tr đ" / "T đ".
 */
@Getter
@AllArgsConstructor
public class TopProductDto {
    private Integer rank;
    private Long productId;
    private String name;
    private String sku;
    /** Số lượng đã bán trong kỳ */
    private Long sold;
    /** Doanh thu VND */
    private BigDecimal revenue;
    /** Rating trung bình (1–5), null nếu chưa có review */
    private BigDecimal rating;
    /** Tổng số lượt review */
    private Integer reviews;
}
