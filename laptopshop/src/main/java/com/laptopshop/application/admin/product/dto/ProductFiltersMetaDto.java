package com.laptopshop.application.admin.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * Metadata cho ProductFilterBar:
 * brands, categories, danh sách status options.
 */
@Getter
@AllArgsConstructor
public class ProductFiltersMetaDto {
    private List<BrandDto> brands;
    private List<CategoryDto> categories;
    /** ["visible", "hidden", "all"] */
    private List<String> statuses;
}
