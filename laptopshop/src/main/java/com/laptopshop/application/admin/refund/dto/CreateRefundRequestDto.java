package com.laptopshop.application.admin.refund.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
public class CreateRefundRequestDto {

    /**
     * ID đơn hàng (Long).
     * Một trong hai orderId hoặc orderCode phải có giá trị.
     */
    private Long orderId;

    /**
     * Mã đơn hàng (String) — frontend thường gửi cái này.
     * Service sẽ ưu tiên orderId nếu có, fallback sang orderCode.
     */
    private String orderCode;

    @NotNull(message = "Số tiền hoàn không được để trống")
    @DecimalMin(value = "1000", message = "Số tiền hoàn tối thiểu 1,000 VND")
    private BigDecimal amount;

    /** Danh sách tên sản phẩm yêu cầu hoàn trả */
    private List<String> products;

    @NotBlank(message = "Lý do hoàn không được để trống")
    private String reason;

    /** ID user/staff tạo request (optional, lấy từ JWT nếu null) */
    private Long requestedById;
}
