package com.laptopshop.application.admin.product.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Params cho GET /admin/products/export — map từ query params.
 */
@Getter
@Setter
@NoArgsConstructor
public class ProductExportRequestDto {
    /** LIST | DETAILS */
    private String type = "LIST";
    private String q;
    private Long brandId;
    private Long categoryId;
    /** "visible" | "hidden" | "all" */
    private String status;
    private int page = 0;
    private int size = 5000;
}
