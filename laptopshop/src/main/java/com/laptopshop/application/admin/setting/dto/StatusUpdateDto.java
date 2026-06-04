package com.laptopshop.application.admin.setting.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class StatusUpdateDto {
    /** active | inactive */
    @NotBlank
    private String status;
}
