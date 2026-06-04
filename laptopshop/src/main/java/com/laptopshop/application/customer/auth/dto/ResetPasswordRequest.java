package com.laptopshop.application.customer.auth.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ResetPasswordRequest {
    private String email;
    private String resetToken; // token nhận từ step 2
    private String newPassword;
}
