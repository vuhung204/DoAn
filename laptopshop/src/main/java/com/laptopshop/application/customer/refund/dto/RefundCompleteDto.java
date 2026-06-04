package com.laptopshop.application.customer.refund.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class RefundCompleteDto {

    @NotNull
    @DecimalMin("0")
    private BigDecimal refundAmount;

    @NotBlank
    private String refundMethod; // BANK / CASH / MOMO / VNPAY

    private String transactionRef;

    private String staffNote;
}
