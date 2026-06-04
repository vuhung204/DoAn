package com.laptopshop.application.customer.cart.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateOrderRequest {
    private Long   addressId;
    private String note;
    private String paymentMethod;

    /**
     * ID của Promotion đã validate ở CartPage.
     * Null = không áp mã giảm giá.
     */
    private Long promotionId;
}
