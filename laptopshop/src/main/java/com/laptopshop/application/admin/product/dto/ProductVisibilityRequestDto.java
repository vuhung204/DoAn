package com.laptopshop.application.admin.product.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.validation.constraints.NotNull;

/** Body cho PATCH /admin/products/{id}/visibility */
@Getter
@Setter
@NoArgsConstructor
public class ProductVisibilityRequestDto {
    @NotNull(message = "visible không được để trống")
    private Boolean visible;
}
