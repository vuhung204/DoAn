package com.laptopshop.application.admin.promotion.dto;

import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
public class PromotionUpdateRequestDto {
    private String     name;
    private String     description;
    private String     type;
    private BigDecimal discount;
    private BigDecimal maxDiscount;
    private BigDecimal minOrderAmount;
    private Integer    minQty;
    private LocalDate  startDate;
    private LocalDate  endDate;
    private Integer    maxUses;
    private Integer    maxUsesPerUser;
    private String     applyMode;
    private List<Long> productIds;
    private List<Long> categoryIds;
}
