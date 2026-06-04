package com.laptopshop.application.admin.dashboard.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Tham số cho export báo cáo Excel.
 * Dùng khi map từ query params của GET /admin/dashboard/export.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExportRequestDto {

    @NotNull(message = "startDate không được để trống")
    private LocalDate startDate;

    @NotNull(message = "endDate không được để trống")
    private LocalDate endDate;

    /** null = tất cả chi nhánh */
    private Long storeId;

    /**
     * Loại báo cáo: REVENUE | ORDERS | INVENTORY
     * Default = REVENUE
     */
    private String type = "REVENUE";
}