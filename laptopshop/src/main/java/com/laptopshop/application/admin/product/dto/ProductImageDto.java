package com.laptopshop.application.admin.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Ảnh sản phẩm — dùng trong ProductDetailDto.
 */
@Getter
@AllArgsConstructor
public class ProductImageDto {
    private Long imageId;
    private String imageUrl;
    private String altText;
    private Boolean isPrimary;
    private Integer sortOrder;
}
