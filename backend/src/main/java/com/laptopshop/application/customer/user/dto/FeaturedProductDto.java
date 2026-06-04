package com.laptopshop.application.customer.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeaturedProductDto {

    private Long id;
    private String name;
    private String slug;
    private String brandName;
    private String categoryName;
    private String categorySlug;

    /** Giá niêm yết */
    private BigDecimal basePrice;

    /** Giá bán thực tế (null → dùng basePrice ở FE) */
    private BigDecimal salePrice;

    /** URL ảnh primary */
    private String imageUrl;

    /** Thông số nhanh */
    private String cpu;
    private String ram;
    private String storage;
    private String display;
    private String gpu;

    /** Rating & review (tính từ reviews đã APPROVED) */
    private Double avgRating;
    private Long reviewCount;

    /** Tổng tồn kho tất cả chi nhánh */
    private Integer totalStock;
}
