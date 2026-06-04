package com.laptopshop.application.customer.warranty.dto;

import com.laptopshop.domain.warranty.entity.WarrantyRequest;
import com.laptopshop.domain.warranty.enums.WarrantyStatus;

import java.time.LocalDateTime;

/**
 * Response trả về cho customer — không lộ thông tin nội bộ staff.
 */
public record WarrantyResponse(
        Long warrantyId,
        WarrantyStatus status,
        String statusLabel,

        // Order info
        Long orderId,
        String orderCode,

        // Product info
        Long orderItemId,
        String productName,
        String productImageUrl,
        Integer quantity,

        // Content
        String issueDescription,
        String staffNote,          // Ghi chú kỹ thuật (hiển thị sau khi APPROVED)
        String rejectionReason,    // Lý do từ chối (hiển thị khi REJECTED)

        // Timestamps
        LocalDateTime createdAt,
        LocalDateTime processedAt,
        LocalDateTime completedAt
) {

    public static WarrantyResponse from(WarrantyRequest w) {
        var item    = w.getOrderItem();
        var product = item.getProduct();

        // Lấy ảnh primary, fallback về ảnh đầu tiên
        String imageUrl = null;
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            imageUrl = product.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .findFirst()
                    .or(() -> product.getImages().stream().findFirst())
                    .map(img -> img.getImageUrl())
                    .orElse(null);
        }

        return new WarrantyResponse(
                w.getId(),
                w.getStatus(),
                toLabel(w.getStatus()),
                w.getOrder().getId(),
                w.getOrder().getOrderCode(),
                item.getId(),
                product.getName(),
                imageUrl,
                item.getQuantity(),
                w.getIssueDescription(),
                w.getStatus() == WarrantyStatus.APPROVED
                        || w.getStatus() == WarrantyStatus.IN_REPAIR
                        || w.getStatus() == WarrantyStatus.COMPLETED
                        ? w.getStaffNote() : null,
                w.getStatus() == WarrantyStatus.REJECTED ? w.getRejectionReason() : null,
                w.getCreatedAt(),
                w.getProcessedAt(),
                w.getCompletedAt()
        );
    }

    /** Summary dùng cho list (không cần fetch chi tiết product image) */
    public static WarrantyResponse summary(WarrantyRequest w) {
        var item    = w.getOrderItem();
        var product = item.getProduct();

        return new WarrantyResponse(
                w.getId(),
                w.getStatus(),
                toLabel(w.getStatus()),
                w.getOrder().getId(),
                w.getOrder().getOrderCode(),
                item.getId(),
                product.getName(),
                null,   // không load image trong list
                item.getQuantity(),
                w.getIssueDescription(),
                null, null,
                w.getCreatedAt(),
                w.getProcessedAt(),
                w.getCompletedAt()
        );
    }

    private static String toLabel(WarrantyStatus status) {
        return switch (status) {
            case PENDING   -> "Chờ xử lý";
            case APPROVED  -> "Đã tiếp nhận";
            case IN_REPAIR -> "Đang sửa chữa";
            case COMPLETED -> "Hoàn thành";
            case REJECTED  -> "Từ chối";
            case CANCELLED -> "Đã hủy";
        };
    }
}
