package com.laptopshop.application.admin.brand.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Stat bar cho trang Brand Management.
 */
@Getter
@AllArgsConstructor
public class BrandStatsDto {
    private Integer totalBrands;
    private Integer activeBrands;
    /** Số brand có ít nhất 1 sản phẩm */
    private Integer brandsWithProducts;
    /** Tổng sản phẩm toàn hệ thống */
    private Integer totalProducts;
}
