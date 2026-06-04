package com.laptopshop.interfaces.rest.user;

import com.laptopshop.application.customer.promotion.dto.ValidatePromotionRequest;
import com.laptopshop.application.customer.promotion.dto.ValidatePromotionResponse;
import com.laptopshop.application.customer.promotion.service.PromotionValidationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoints khuyến mãi dành cho phía customer (không cần admin role).
 *
 * POST /api/promotions/validate
 *   → Validate mã giảm giá từ CartPage / CheckoutPage
 *   → Trả về discountAmount, shippingFeeAfterDiscount, total đã tính sẵn
 */
@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionValidationService validationService;

    /**
     * Validate mã giảm giá.
     *
     * Request body:
     * {
     *   "code":     "LAPTOP10",
     *   "subtotal": 15000000,
     *   "totalQty": 2
     * }
     *
     * Success 200:
     * {
     *   "promotionId": 1,
     *   "code":         "LAPTOP10",
     *   "name":         "Giảm 10% tất cả laptop",
     *   "discountType": "percent",
     *   "discountValue": 10,
     *   "discountAmount": 1500000,
     *   "shippingFeeAfterDiscount": 0,
     *   "total": 13500000
     * }
     *
     * Error 400: { "error": "Mã giảm giá không hợp lệ hoặc đã hết hạn" }
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validatePromotion(
            @Valid @RequestBody ValidatePromotionRequest request) {
        try {
            ValidatePromotionResponse response = validationService.validate(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }
}
