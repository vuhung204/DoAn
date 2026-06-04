package com.laptopshop.application.admin.brand.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Params cho GET /admin/brands/export — map từ query params.
 */
@Getter
@Setter
@NoArgsConstructor
public class BrandExportRequestDto {
    /** "xlsx" | "csv" — default xlsx */
    private String format = "xlsx";
    private String q;
    private Boolean active;
}
