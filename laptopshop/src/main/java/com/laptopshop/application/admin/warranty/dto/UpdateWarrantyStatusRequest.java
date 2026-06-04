package com.laptopshop.application.admin.warranty.dto;

import com.laptopshop.domain.warranty.enums.WarrantyStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Staff dùng DTO này để chuyển trạng thái warranty.
 *
 * Các transition hợp lệ:
 *   PENDING   → APPROVED  : staffNote tùy chọn
 *   PENDING   → REJECTED  : rejectionReason bắt buộc
 *   APPROVED  → IN_REPAIR : staffNote tùy chọn
 *   IN_REPAIR → COMPLETED : staffNote tùy chọn
 */
public record UpdateWarrantyStatusRequest(

        @NotNull(message = "Trạng thái mới không được để trống")
        WarrantyStatus newStatus,

        @Size(max = 2000, message = "Ghi chú không quá 2000 ký tự")
        String staffNote,

        @Size(max = 1000, message = "Lý do từ chối không quá 1000 ký tự")
        String rejectionReason

) {}
