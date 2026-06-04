package com.laptopshop.application.admin.order.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ShipRequestDto {
    @NotBlank(message = "Đơn vị vận chuyển không được để trống")
    private String carrier;

    private String trackingNumber;

    private LocalDateTime shippedAt;
}
