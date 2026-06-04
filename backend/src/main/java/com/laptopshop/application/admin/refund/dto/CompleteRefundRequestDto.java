package com.laptopshop.application.admin.refund.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class CompleteRefundRequestDto {
    /** BANK / CASH / MOMO / VNPAY */
    @NotBlank(message = "Phương thức hoàn tiền không được để trống")
    private String method;

    private String transactionRef;

    private Long processedById;
}
