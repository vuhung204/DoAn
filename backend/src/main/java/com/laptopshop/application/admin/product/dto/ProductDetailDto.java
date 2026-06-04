package com.laptopshop.application.admin.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Chi tiết đầy đủ sản phẩm — dùng cho ProductForm (edit) và trang detail.
 */
@Getter
@AllArgsConstructor
public class ProductDetailDto {
    private Long id;
    private String name;
    private String sku;
    private String slug;
    private Long brandId;
    private String brand;
    private Long categoryId;
    private String category;
    private String description;
    /** Giá gốc VND */
    private Long basePrice;
    /** Giá khuyến mãi VND — null nếu không có */
    private Long salePrice;
    /** Tổng tồn kho tất cả chi nhánh */
    private Integer stock;
    /** Ngưỡng tối thiểu */
    private Integer minStock;
    private ProductSpecsDto specs;
    private List<ProductImageDto> images;
    private Boolean visible;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
