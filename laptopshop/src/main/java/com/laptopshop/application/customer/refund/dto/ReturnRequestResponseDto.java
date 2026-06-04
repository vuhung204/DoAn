package com.laptopshop.application.customer.refund.dto;

import com.laptopshop.domain.refund.enums.ReturnStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ReturnRequestResponseDto {

    private Long returnId;
    private Long orderId;
    private String orderCode;
    private ReturnStatus status;
    private String reason;
    private String staffNote;
    private BigDecimal refundAmount;
    private String refundMethod;
    private String transactionRef;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;

    private List<ReturnItemResponseDto> items;
    private List<AuditLogDto> auditLogs;

    @Data
    @Builder
    public static class ReturnItemResponseDto {
        private Long orderItemId;
        private Long productId;
        private String productName;
        private String productSku;
        private Integer quantity;
        private BigDecimal unitPrice;
        private String reason;
        private BigDecimal refundAmount;
    }

    @Data
    @Builder
    public static class AuditLogDto {
        private ReturnStatus oldStatus;
        private ReturnStatus newStatus;
        private String staffName;
        private String note;
        private LocalDateTime createdAt;
    }
}
