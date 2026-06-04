package com.laptopshop.application.admin.inventory.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class AdjustStockRequestDto {
    @NotNull private Long   productId;
    @NotNull private Long   branchId;
    @NotNull private Integer delta;
    private String reason;
    private Long   staffId;
}