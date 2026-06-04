package com.laptopshop.application.admin.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.math.BigDecimal;
import java.util.Map;

@Getter @AllArgsConstructor
public class ProductInventoryDto {
    private Long              productId;
    private String            sku;
    private String            name;
    /** branchId → quantity */
    private Map<Long,Integer> stockByBranch;
    private int               totalStock;
    private int               minStock;
    private boolean           lowStock;
    private BigDecimal        estimatedValue;
}
