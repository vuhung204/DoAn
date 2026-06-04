package com.laptopshop.application.customer.cart.dto;

import com.laptopshop.domain.catalog.entity.ProductImage;
import com.laptopshop.domain.order.entity.OrderItem;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class OrderItemResponse {
    private Long       itemId;
    private Long       productId;
    private String     productName;
    private String     brandName;
    private String     image;
    private Integer    quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private boolean    reviewed;
    private boolean    hasWarranty;  // ← thêm
    private boolean    hasRefunded;  // ← thêm

    public static OrderItemResponse from(OrderItem item) {
        return from(item, false, false, false);
    }

    public static OrderItemResponse from(OrderItem item, boolean reviewed) {
        return from(item, reviewed, false, false);
    }

    // ← method mới dùng trong getOrderDetail
    public static OrderItemResponse from(OrderItem item, boolean reviewed,
                                         boolean hasWarranty, boolean hasRefunded) {
        OrderItemResponse dto = new OrderItemResponse();
        dto.itemId      = item.getId();
        dto.productId   = item.getProduct().getId();
        dto.productName = item.getProduct().getName();
        dto.brandName   = item.getProduct().getBrand() != null
                ? item.getProduct().getBrand().getName() : null;

        if (item.getProduct().getImages() != null && !item.getProduct().getImages().isEmpty()) {
            dto.image = item.getProduct().getImages().stream()
                    .filter(ProductImage::getIsPrimary)
                    .findFirst()
                    .map(ProductImage::getImageUrl)
                    .orElse(item.getProduct().getImages().get(0).getImageUrl());
        }

        dto.quantity     = item.getQuantity();
        dto.unitPrice    = item.getUnitPrice();
        dto.totalPrice   = item.getTotalPrice();
        dto.reviewed     = reviewed;
        dto.hasWarranty  = hasWarranty;  // ← thêm
        dto.hasRefunded  = hasRefunded;  // ← thêm
        return dto;
    }
}
