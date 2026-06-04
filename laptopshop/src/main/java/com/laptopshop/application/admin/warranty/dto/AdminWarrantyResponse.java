package com.laptopshop.application.admin.warranty.dto;

import com.laptopshop.domain.warranty.entity.WarrantyRequest;
import com.laptopshop.domain.warranty.enums.WarrantyStatus;

import java.time.LocalDateTime;

/**
 * Response dành riêng cho admin/staff — hiển thị đầy đủ hơn WarrantyResponse của customer:
 * thêm thông tin user, staff xử lý, và toàn bộ nội dung staffNote / rejectionReason.
 */
public record AdminWarrantyResponse(
        Long warrantyId,
        WarrantyStatus status,
        String statusLabel,

        // Order info
        Long orderId,
        String orderCode,

        // Product info
        Long orderItemId,
        String productName,
        Integer quantity,

        // Customer info
        Long userId,
        String customerName,
        String customerEmail,
        String customerPhone,

        // Staff info
        Long handledById,
        String handledByName,

        // Content
        String issueDescription,
        String staffNote,
        String rejectionReason,

        // Timestamps
        LocalDateTime createdAt,
        LocalDateTime processedAt,
        LocalDateTime completedAt,
        LocalDateTime updatedAt
) {

    public static AdminWarrantyResponse from(WarrantyRequest w) {
        var item    = w.getOrderItem();
        var product = item.getProduct();
        var user    = w.getUser();
        var staff   = w.getHandledBy();

        return new AdminWarrantyResponse(
                w.getId(),
                w.getStatus(),
                toLabel(w.getStatus()),

                w.getOrder().getId(),
                w.getOrder().getOrderCode(),

                item.getId(),
                product.getName(),
                item.getQuantity(),

                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),

                staff != null ? staff.getId()       : null,
                staff != null ? staff.getFullName() : null,

                w.getIssueDescription(),
                w.getStaffNote(),
                w.getRejectionReason(),

                w.getCreatedAt(),
                w.getProcessedAt(),
                w.getCompletedAt(),
                w.getUpdatedAt()
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