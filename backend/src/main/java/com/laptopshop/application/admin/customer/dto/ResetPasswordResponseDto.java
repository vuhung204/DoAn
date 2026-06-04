package com.laptopshop.application.admin.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Response cho POST /admin/customers/{id}/reset-password.
 * tempPassword chỉ trả về trong môi trường dev/staging;
 * production nên chỉ gửi email và để tempPassword = null.
 */
@Getter
@AllArgsConstructor
public class ResetPasswordResponseDto {
    private Boolean emailSent;
    private String tempPassword;
}