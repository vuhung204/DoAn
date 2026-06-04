package com.laptopshop.application.admin.brand.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.constraints.Size;

/**
 * Request body cho PUT /admin/brands/{id}.
 * Tất cả fields optional — chỉ update field không null.
 */
@Getter
@Setter
@NoArgsConstructor
public class UpdateBrandRequestDto {

    @Size(max = 255)
    private String name;

    @Size(max = 255)
    private String slug;

    private String logoUrl;
    private String description;

    @Size(max = 500)
    private String website;

    private Boolean active;
}
