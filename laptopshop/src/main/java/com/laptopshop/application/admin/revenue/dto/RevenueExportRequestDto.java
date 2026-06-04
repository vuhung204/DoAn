package com.laptopshop.application.admin.revenue.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

/**
 * Tham số export Excel trang Revenue.
 * Map từ query params GET /admin/revenue/export.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RevenueExportRequestDto {

    /** day | month | year */
    @NotBlank(message = "mode không được để trống")
    private String mode;

    @NotNull(message = "startDate không được để trống")
    private LocalDate startDate;

    @NotNull(message = "endDate không được để trống")
    private LocalDate endDate;

    /** null = tất cả chi nhánh */
    private List<Long> branchIds;

    /**
     * Loại sheet xuất: SUMMARY | SERIES | BRANCHES | DETAILS
     * Default = SUMMARY
     */
    private String type = "SUMMARY";
}
