package com.laptopshop.application.admin.promotion.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import java.util.List;

@Getter
public class PromotionProductAssignRequestDto {
    @NotNull
    private List<Long> productIds;
}
