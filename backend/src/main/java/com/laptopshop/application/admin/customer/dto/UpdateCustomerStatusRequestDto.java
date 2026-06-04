package com.laptopshop.application.admin.customer.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request body cho PUT /admin/customers/{id}/status.
 *
 * status hợp lệ: "active" | "locked" | "unverified"
 * Map sang UserStatus enum:
 *   "active"     → UserStatus.ACTIVE
 *   "locked"     → UserStatus.LOCKED
 *   "unverified" → UserStatus.UNVERIFIED
 *
 * Lưu ý: UserStatus không có INACTIVE — frontend nên dùng "unverified" thay thế.
 */
@Getter
@Setter
@NoArgsConstructor
public class UpdateCustomerStatusRequestDto {

    @NotBlank(message = "status không được để trống")
    @Pattern(regexp = "active|locked|unverified",
            message = "status phải là: active | locked | unverified")
    private String status;

    /** Ghi chú của nhân viên (tuỳ chọn) */
    private String staffNote;
}
