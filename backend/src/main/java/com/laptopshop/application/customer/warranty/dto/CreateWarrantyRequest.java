package com.laptopshop.application.customer.warranty.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// ─── Request DTOs ─────────────────────────────────────────────────────────────

/**
 * Khách tạo yêu cầu bảo hành cho 1 order item.
 */
public record CreateWarrantyRequest(

        @NotNull(message = "orderItemId không được để trống")
        Long orderItemId,

        @NotBlank(message = "Mô tả lỗi không được để trống")
        @Size(min = 10, max = 2000, message = "Mô tả lỗi phải từ 10 đến 2000 ký tự")
        String issueDescription

) {}

