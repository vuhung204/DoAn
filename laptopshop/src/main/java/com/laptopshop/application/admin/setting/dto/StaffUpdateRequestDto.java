package com.laptopshop.application.admin.setting.dto;

import jakarta.validation.constraints.Email;
import lombok.Getter;

@Getter
public class StaffUpdateRequestDto {
    private String fullName;
    @Email private String email;
    private String phone;
    private Long   storeId;
    private Long   roleId;
    private String status;
}