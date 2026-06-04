package com.laptopshop.application.admin.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Địa chỉ giao hàng của khách.
 * label: build từ recipientName — vì entity Address không có field label riêng.
 * text:  build từ addressLine + ward + district + city.
 */
@Getter
@AllArgsConstructor
public class AddressDto {
    private Long id;
    /** Ví dụ: "Nguyễn Văn A · 0912345678" */
    private String label;
    /** Địa chỉ đầy đủ: "123 Lê Lợi, P.Bến Nghé, Q.1, TP.HCM" */
    private String text;
    private Boolean isDefault;
}
