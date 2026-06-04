package com.laptopshop.application.admin.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.math.BigDecimal;

@Getter @AllArgsConstructor
public class BranchInventoryDto {
    private Long       branchId;
    private String     name;
    private int        productCount;
    private int        totalQuantity;
    private int        lowStockCount;
    private BigDecimal inventoryValue;
}
