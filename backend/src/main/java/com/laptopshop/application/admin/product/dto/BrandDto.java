package com.laptopshop.application.admin.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** Dùng cho filter bar và dropdown chọn brand khi tạo/sửa sản phẩm. */
@Getter
@AllArgsConstructor
public class BrandDto {
    private Long id;
    private String name;
    private String logoUrl;
}