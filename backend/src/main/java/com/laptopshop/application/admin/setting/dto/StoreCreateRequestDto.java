package com.laptopshop.application.admin.setting.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class StoreCreateRequestDto {
    @NotBlank private String name;
    @NotBlank private String address;
    private String district;
    @NotBlank private String city;
    private String phone;
    private String email;
    /** active | inactive — default active */
    private String status = "active";
}