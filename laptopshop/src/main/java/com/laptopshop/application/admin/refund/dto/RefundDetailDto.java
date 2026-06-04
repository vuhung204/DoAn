package com.laptopshop.application.admin.refund.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class RefundDetailDto {
    private Long          id;
    private String        orderCode;
    private String        customerName;
    private String        branchName;
    private BigDecimal    amount;
    /** Tên sản phẩm yêu cầu hoàn trả */
    private List<String>  products;
    private String        reason;
    private String        status;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;    // nullable
    private String        processedBy;    // nullable — tên staff
    private String        note;           // nullable
    private String        transactionRef; // nullable
    private String        paymentMethod;  // nullable
}
