package com.laptopshop.application.admin.refund.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class RefundListDto {
    private Long          id;
    private String        orderCode;
    private String        customerName;
    private String        branchName;
    private BigDecimal    amount;
    /** Frontend status string: "waiting","approved","done","rejected" */
    private String        status;
    private LocalDateTime requestedAt;
}
