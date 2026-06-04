package com.laptopshop.application.admin.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Request body for POST /api/admin/orders
 * Admin tạo đơn hàng tại quầy thay mặt khách hàng.
 *
 * Hai trường hợp:
 *  1. Khách đã có tài khoản → truyền userId
 *  2. Khách vãng lai         → truyền walkInCustomer (tên + phone)
 *
 * Bắt buộc:
 *  - storeId      : chi nhánh xử lý
 *  - paymentMethod: COD | CASH | BANK_TRANSFER | MOMO | VNPAY | ZALOPAY | CREDIT_CARD
 *  - items        : danh sách sản phẩm (ít nhất 1 dòng)
 */
@Getter
@Setter
public class AdminCreateOrderRequest {

    /** ID khách hàng có tài khoản. Null nếu là khách vãng lai. */
    private Long userId;

    /** Thông tin khách vãng lai — bắt buộc khi userId == null. */
    @Valid
    private WalkInCustomerDto walkInCustomer;

    /** Chi nhánh xử lý đơn — bắt buộc. */
    @NotNull(message = "storeId không được để trống")
    private Long storeId;

    /**
     * Phương thức thanh toán — bắt buộc.
     * Giá trị hợp lệ: COD, CASH, BANK_TRANSFER, MOMO, VNPAY, ZALOPAY, CREDIT_CARD
     */
    @NotBlank(message = "paymentMethod không được để trống")
    private String paymentMethod;

    /** Danh sách sản phẩm — bắt buộc, ít nhất 1 dòng. */
    @NotNull
    @Size(min = 1, message = "Đơn hàng phải có ít nhất 1 sản phẩm")
    @Valid
    private List<OrderLineRequest> items;

    /** Ghi chú đơn hàng (tùy chọn). */
    private String note;

    /** ID mã khuyến mãi (tùy chọn). */
    private Long promotionId;

    // ── Nested DTOs ────────────────────────────────────────────────────────

    @Getter
    @Setter
    public static class WalkInCustomerDto {

        @NotBlank(message = "Tên khách hàng không được để trống")
        private String name;

        @NotBlank(message = "Số điện thoại không được để trống")
        @Pattern(regexp = "^(0|\\+84)[0-9]{8,10}$",
                message = "Số điện thoại không hợp lệ")
        private String phone;

        /** Email khách vãng lai — tùy chọn. */
        private String email;
    }

    @Getter
    @Setter
    public static class OrderLineRequest {

        @NotNull(message = "productId không được để trống")
        private Long productId;

        @NotNull
        @Min(value = 1, message = "Số lượng phải >= 1")
        private Integer quantity;
    }
}
