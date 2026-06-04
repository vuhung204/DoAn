package com.laptopshop.application.admin.brand.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateBrandRequestDto {

    @NotBlank(message = "Tên brand không được để trống")
    @Size(max = 255)
    private String name;

    /**
     * Slug URL-friendly.
     */
    @Size(max = 255)
    private String slug;

    private String logoUrl;

    private String description;

    @Size(max = 500)
    private String website;

    private Boolean active = true;
}