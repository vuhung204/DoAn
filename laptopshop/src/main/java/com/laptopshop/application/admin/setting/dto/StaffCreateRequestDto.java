package com.laptopshop.application.admin.setting.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class StaffCreateRequestDto {
    @NotBlank private String fullName;
    @NotBlank @Email private String email;
    private String phone;
    @NotNull  private Long   storeId;
    @NotNull  private Long   roleId;
    /** Mật khẩu ban đầu. Null → gửi email mời. */
    private String           password;
    private String           status = "active";
}
