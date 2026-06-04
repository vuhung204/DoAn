package com.laptopshop.application.admin.promotion.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class PromotionStatusUpdateDto {
    /** active | inactive */
    @NotBlank
    private String status;
}
