package com.laptopshop.application.admin.promotion.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
public class PromotionCreateRequestDto {
    @NotBlank private String     code;
    @NotBlank private String     name;
    private String               description;
    @NotBlank private String     type;       // percent | fixed | free_ship
    @NotNull  private BigDecimal discount;
    private BigDecimal           maxDiscount;
    private BigDecimal           minOrderAmount;
    private Integer              minQty;
    @NotNull  private LocalDate  startDate;
    @NotNull  private LocalDate  endDate;
    private Integer              maxUses;
    private Integer              maxUsesPerUser;
    /** all | select */
    private String               applyMode = "all";
    private List<Long>           productIds;
    private List<Long>           categoryIds;
}