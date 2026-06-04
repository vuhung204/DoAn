package com.laptopshop.application.admin.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.math.BigDecimal;
import java.util.List;

@Getter @AllArgsConstructor
public class InventoryOverviewDto {
    private List<BranchInventoryDto> branches;
    private int        totalProducts;
    private int        totalQuantity;
    private int        totalLowStock;
    private BigDecimal totalValue;
}
