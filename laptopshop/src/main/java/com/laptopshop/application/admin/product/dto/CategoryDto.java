package com.laptopshop.application.admin.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** Dùng cho filter bar và dropdown chọn category khi tạo/sửa sản phẩm. */
@Getter
@AllArgsConstructor
public class CategoryDto {
    private Long id;
    private String name;
    private Long parentId;
    private Integer sortOrder;
}
