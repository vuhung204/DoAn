package com.laptopshop.application.admin.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Địa chỉ giao hàng của khách.
 * label: build từ recipientName
 * text:  build từ addressLine + ward + district + city.
 */
@Getter
@AllArgsConstructor
public class AddressDto {
    private Long id;
    private String label;
    private String text;
    private Boolean isDefault;
}
