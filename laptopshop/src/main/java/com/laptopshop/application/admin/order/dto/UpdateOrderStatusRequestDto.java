package com.laptopshop.application.admin.order.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

/**
 * FE gửi: { "status": "confirmed", "staffNote": "..." }
 * Đổi field newStatus → status để khớp với FE body.
 */
@Getter
public class UpdateOrderStatusRequestDto {
    /** Frontend string: "confirmed","processing","shipping","done","cancelled" */
    @NotBlank(message = "status không được để trống")
    private String status;     // ← đổi từ newStatus → status

    private String staffNote;

    private Long storeId;
}
