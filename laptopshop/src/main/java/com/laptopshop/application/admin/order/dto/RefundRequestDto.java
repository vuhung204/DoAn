package com.laptopshop.application.admin.order.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class RefundRequestDto {
    @NotNull(message = "Số tiền hoàn không được để trống")
    @DecimalMin(value = "1000", message = "Số tiền hoàn tối thiểu 1,000 VND")
    private BigDecimal amount;

    @NotBlank(message = "Lý do hoàn không được để trống")
    private String reason;
}
