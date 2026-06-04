package com.laptopshop.application.customer.promotion.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

/**
 * FE gửi lên khi đặt hàng (POST /api/orders).
 *
 * promotionId – nullable; nếu user đã validate mã thì truyền vào để BE
 *               gắn Promotion vào Order và tăng used_count.
 */
@Getter
@Setter
public class CreateOrderRequest {

    @NotNull(message = "Thiếu địa chỉ giao hàng")
    @Positive
    private Long addressId;

    @NotNull(message = "Thiếu phương thức thanh toán")
    private String paymentMethod;

    /** ID của Promotion đã validate ở CartPage. Null = không áp mã. */
    private Long promotionId;

    private String note;
}
