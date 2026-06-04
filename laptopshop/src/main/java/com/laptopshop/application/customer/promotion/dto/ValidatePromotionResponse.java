package com.laptopshop.application.customer.promotion.dto;

import com.laptopshop.domain.order.entity.Promotion;
import com.laptopshop.domain.order.enums.DiscountType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * BE trả về cho FE sau khi validate mã giảm giá.
 *
 * FE dùng discountAmount để hiển thị trực tiếp (không tự tính lại).
 * promotionId được truyền lại vào CreateOrderRequest để BE gắn vào Order.
 */
@Getter
@Builder
public class ValidatePromotionResponse {

    private Long   promotionId;
    private String code;
    private String name;

    /** percent | fixed | free_ship */
    private String discountType;

    /** Giá trị gốc: % hoặc số tiền cố định */
    private BigDecimal discountValue;

    /** Số tiền thực tế được giảm (đã áp dụng maxDiscount nếu có) */
    private BigDecimal discountAmount;

    /** Phí ship sau khuyến mãi (= 0 nếu FREE_SHIP, ngược lại = shippingFee gốc) */
    private BigDecimal shippingFeeAfterDiscount;

    /** Tổng thanh toán = subtotal - discountAmount + shippingFeeAfterDiscount */
    private BigDecimal total;

    // ─── Factory ──────────────────────────────────────────────────────────────

    /**
     * @param promo        Promotion entity đã validate
     * @param subtotal     Tổng tiền hàng (chưa giảm, chưa ship)
     * @param shippingFee  Phí ship gốc (do caller tính theo rule nghiệp vụ)
     */
    public static ValidatePromotionResponse from(
            Promotion promo,
            BigDecimal subtotal,
            BigDecimal shippingFee) {

        BigDecimal discountAmount;
        BigDecimal shippingAfter = shippingFee;

        switch (promo.getDiscountType()) {
            case PERCENT -> {
                // discountValue = %, ví dụ 10 → giảm 10%
                BigDecimal raw = subtotal
                        .multiply(promo.getDiscountValue())
                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

                // áp trần maxDiscount nếu có
                discountAmount = (promo.getMaxDiscount() != null && raw.compareTo(promo.getMaxDiscount()) > 0)
                        ? promo.getMaxDiscount()
                        : raw;
            }
            case FIXED -> {
                // giảm số tiền cố định, không vượt subtotal
                discountAmount = promo.getDiscountValue().min(subtotal);
            }
            case FREE_SHIP -> {
                discountAmount = BigDecimal.ZERO;
                shippingAfter  = BigDecimal.ZERO;
            }
            default -> discountAmount = BigDecimal.ZERO;
        }

        BigDecimal total = subtotal.subtract(discountAmount).add(shippingAfter);

        return ValidatePromotionResponse.builder()
                .promotionId(promo.getId())
                .code(promo.getCode())
                .name(promo.getName())
                .discountType(promo.getDiscountType().toFrontend())
                .discountValue(promo.getDiscountValue())
                .discountAmount(discountAmount)
                .shippingFeeAfterDiscount(shippingAfter)
                .total(total)
                .build();
    }
}