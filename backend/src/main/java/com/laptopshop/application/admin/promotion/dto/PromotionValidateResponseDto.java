package com.laptopshop.application.admin.promotion.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter @AllArgsConstructor
public class PromotionValidateResponseDto {
    private boolean valid;
    private String  message;
}
