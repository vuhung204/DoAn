package com.laptopshop.application.customer.promotion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * FE gửi lên khi user nhập mã giảm giá tại CartPage.
 *
 * subtotal  – tổng tiền hàng (trước phí ship) để BE kiểm tra min_order_amount
 * totalQty  – tổng số lượng sản phẩm trong giỏ để BE kiểm tra min_qty
 */
@Getter
@Setter
public class ValidatePromotionRequest {

    @NotBlank(message = "Mã giảm giá không được để trống")
    private String code;

    @NotNull(message = "Thiếu tổng tiền hàng")
    @Positive
    private BigDecimal subtotal;

    @NotNull(message = "Thiếu tổng số lượng")
    @Positive
    private Integer totalQty;
}
