package com.laptopshop.application.customer.promotion.service;

import com.laptopshop.application.customer.promotion.dto.ValidatePromotionRequest;
import com.laptopshop.application.customer.promotion.dto.ValidatePromotionResponse;
import com.laptopshop.domain.order.entity.Promotion;
import com.laptopshop.domain.order.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Validate mã giảm giá từ CartPage / CheckoutPage.
 *
 * Rules:
 *  1. Mã phải tồn tại, is_active = true, còn hạn dùng.
 *  2. Tổng tiền hàng >= min_order_amount của promotion.
 *  3. Tổng số lượng sản phẩm >= min_qty của promotion.
 *  4. used_count < max_uses (nếu max_uses != null).
 *
 * Phí ship gốc: subtotal >= 10.000.000 → miễn phí, ngược lại 200.000₫
 * (cùng rule với CartPage hiện tại).
 */
@Service
@RequiredArgsConstructor
public class PromotionValidationService {

    private static final BigDecimal FREE_SHIP_THRESHOLD = new BigDecimal("10000000");
    private static final BigDecimal DEFAULT_SHIPPING_FEE = new BigDecimal("200000");

    private final PromotionRepository promotionRepository;

    public ValidatePromotionResponse validate(ValidatePromotionRequest req) {

        // 1. Tìm promotion còn hiệu lực
        Promotion promo = promotionRepository
                .findActiveByCode(req.getCode(), LocalDateTime.now())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Mã giảm giá không hợp lệ hoặc đã hết hạn"));

        // 2. Kiểm tra min_order_amount
        if (req.getSubtotal().compareTo(promo.getMinOrderAmount()) < 0) {
            throw new IllegalArgumentException(String.format(
                    "Đơn hàng tối thiểu %s₫ để áp dụng mã này",
                    promo.getMinOrderAmount().toPlainString()));
        }

        // 3. Kiểm tra min_qty
        if (req.getTotalQty() < promo.getMinQty()) {
            throw new IllegalArgumentException(String.format(
                    "Cần tối thiểu %d sản phẩm để áp dụng mã này",
                    promo.getMinQty()));
        }

        // 4. Kiểm tra quota tổng
        if (promo.getMaxUses() != null && promo.getUsedCount() >= promo.getMaxUses()) {
            throw new IllegalArgumentException("Mã giảm giá đã hết lượt sử dụng");
        }

        // Tính phí ship theo rule nghiệp vụ
        BigDecimal shippingFee = req.getSubtotal().compareTo(FREE_SHIP_THRESHOLD) >= 0
                ? BigDecimal.ZERO
                : DEFAULT_SHIPPING_FEE;

        return ValidatePromotionResponse.from(promo, req.getSubtotal(), shippingFee);
    }
}
