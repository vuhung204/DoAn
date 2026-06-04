package com.laptopshop.application.admin.productreport.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.List;

/**
 * Tham số export Excel trang Product Report.
 * Map từ query params GET /admin/products/report/export.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductReportExportRequestDto {

    /** week | month | quarter */
    @NotBlank(message = "period không được để trống")
    private String period;

    private LocalDate startDate;
    private LocalDate endDate;

    /** null = tất cả chi nhánh */
    private List<Long> storeIds;

    /** null = tất cả danh mục */
    private List<Long> categoryIds;

    /**
     * Loại sheet: SUMMARY | TOP_PRODUCTS | OVERSTOCK | DEADSTOCK | CATEGORY
     * Default = SUMMARY
     */
    private String type = "SUMMARY";
}
