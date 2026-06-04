package com.laptopshop.application.admin.brand.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.constraints.NotNull;

/** Body cho PATCH /admin/brands/{id}/active */
@Getter
@Setter
@NoArgsConstructor
public class BrandActiveRequestDto {
    @NotNull(message = "active không được để trống")
    private Boolean active;
}
