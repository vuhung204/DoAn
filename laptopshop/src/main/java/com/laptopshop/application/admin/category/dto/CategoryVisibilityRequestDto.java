package com.laptopshop.application.admin.category.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class CategoryVisibilityRequestDto {
    @NotNull
    private Boolean visible;
}
