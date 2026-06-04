package com.laptopshop.application.admin.promotion.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @AllArgsConstructor
public class PromotionListDto {
    private Long       id;
    private String     code;
    private String     name;
    /** Frontend type: percent | fixed | free_ship */
    private String     type;
    private BigDecimal discount;
    private BigDecimal maxDiscount;
    private LocalDate  startDate;
    private LocalDate  endDate;
    private Integer    usedCount;
    private Integer    maxUses;
    /** active | inactive | upcoming | expired */
    private String     status;
}