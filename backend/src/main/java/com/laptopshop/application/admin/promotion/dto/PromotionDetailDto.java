package com.laptopshop.application.admin.promotion.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter @AllArgsConstructor
public class PromotionDetailDto {
    private Long       id;
    private String     code;
    private String     name;
    private String     description;
    private String     type;
    private BigDecimal discount;
    private BigDecimal maxDiscount;
    private BigDecimal minOrderAmount;
    private Integer    minQty;
    private LocalDate  startDate;
    private LocalDate  endDate;
    private Integer    usedCount;
    private Integer    maxUses;
    private Integer    maxUsesPerUser;
    /** all | select */
    private String     applyMode;
    private List<Long> productIds;
    private List<Long> categoryIds;
    private String     status;
    private boolean    isActive;
    private String     createdBy;
    private LocalDateTime createdAt;
}