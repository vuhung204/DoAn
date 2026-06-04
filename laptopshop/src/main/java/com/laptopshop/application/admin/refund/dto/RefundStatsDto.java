package com.laptopshop.application.admin.refund.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@AllArgsConstructor
public class RefundStatsDto {
    private long              totalRequests;
    /** key = frontend status string ("waiting","approved","done","rejected") */
    private Map<String, Long> countsByStatus;
    private BigDecimal        totalAmountRequested;
    private BigDecimal        totalAmountRefunded;  // chỉ tính status = REFUNDED
}
