package com.laptopshop.application.customer.cart.dto;

import com.laptopshop.domain.order.entity.Address;
import com.laptopshop.domain.order.entity.Order;
import com.laptopshop.domain.order.entity.Payment;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
public class OrderResponse {

    // ── Core fields ───────────────────────────────────────────────────────────
    private Long          id;
    private String        orderCode;
    private String        status;
    private BigDecimal    subtotal;
    private BigDecimal    discountAmount;
    private BigDecimal    shippingFee;
    private BigDecimal    totalAmount;
    private String        note;
    private LocalDateTime orderedAt;   // ← đổi từ createdAt (khớp với FE)

    // ── Items ─────────────────────────────────────────────────────────────────
    private List<OrderItemResponse> items;

    // ── Address (nullable — mua trực tiếp tại cửa hàng thì null) ─────────────
    private AddressDto address;

    // ── Payment (nullable — COD chưa thanh toán) ──────────────────────────────
    private PaymentDto payment;

    // ─── Nested DTOs ──────────────────────────────────────────────────────────

    @Getter
    public static class AddressDto {
        private String recipientName;
        private String phone;
        private String addressLine;
        private String ward;
        private String district;
        private String city;

        public static AddressDto from(Address a) {
            if (a == null) return null;
            AddressDto dto = new AddressDto();
            dto.recipientName = a.getRecipientName();
            dto.phone         = a.getPhone();
            dto.addressLine   = a.getAddressLine();
            dto.ward          = a.getWard();
            dto.district      = a.getDistrict();
            dto.city          = a.getCity();
            return dto;
        }
    }

    @Getter
    public static class PaymentDto {
        /** Lowercase để khớp PaymentMethod type ở FE: cod | bank_transfer | momo... */
        private String method;
        /** Lowercase để khớp PaymentStatus type ở FE: pending | paid | failed | refunded */
        private String status;
        private BigDecimal    amount;
        private String        transactionId;
        private LocalDateTime paidAt;

        public static PaymentDto from(Payment p) {
            if (p == null) return null;
            PaymentDto dto = new PaymentDto();
            dto.method        = p.getMethod().name().toLowerCase();
            dto.status        = p.getStatus().name().toLowerCase();
            dto.amount        = p.getAmount();
            dto.transactionId = p.getTransactionId();
            dto.paidAt        = p.getPaidAt();
            return dto;
        }
    }

    // ─── Factory ──────────────────────────────────────────────────────────────

    public static OrderResponse from(Order order) {
        OrderResponse dto = new OrderResponse();
        dto.id             = order.getId();
        dto.orderCode      = order.getOrderCode();
        // status lowercase để khớp OrderStatus type ở FE
        dto.status         = order.getStatus().name().toLowerCase();
        dto.subtotal       = order.getSubtotal();
        dto.discountAmount = order.getDiscountAmount();
        dto.shippingFee    = order.getShippingFee();
        dto.totalAmount    = order.getTotalAmount();
        dto.note           = order.getNote();
        dto.orderedAt      = order.getOrderedAt();

        dto.items = order.getItems() != null
                ? order.getItems().stream()
                .map(OrderItemResponse::from)
                .collect(Collectors.toList())
                : List.of();

        dto.address = AddressDto.from(order.getAddress());
        dto.payment = PaymentDto.from(order.getPayment());

        return dto;
    }

    public static OrderResponse fromWithItems(Order order, List<OrderItemResponse> itemDtos) {
        OrderResponse dto = new OrderResponse();
        dto.id             = order.getId();
        dto.orderCode      = order.getOrderCode();
        dto.status         = order.getStatus().name().toLowerCase();
        dto.subtotal       = order.getSubtotal();
        dto.discountAmount = order.getDiscountAmount();
        dto.shippingFee    = order.getShippingFee();
        dto.totalAmount    = order.getTotalAmount();
        dto.note           = order.getNote();
        dto.orderedAt      = order.getOrderedAt();
        dto.items          = itemDtos;              // ← dùng itemDtos đã build sẵn
        dto.address        = AddressDto.from(order.getAddress());
        dto.payment        = PaymentDto.from(order.getPayment());
        return dto;
    }
}
