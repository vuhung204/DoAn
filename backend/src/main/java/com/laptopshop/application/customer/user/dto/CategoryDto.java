package com.laptopshop.application.customer.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {

    private Long id;
    private String name;
    private String slug;
    private Integer sortOrder;

    /** Số sản phẩm active trong danh mục (bao gồm sub-category) */
    private Long productCount;
}

