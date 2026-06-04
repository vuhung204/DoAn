package com.laptopshop.application.admin.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter @AllArgsConstructor
public class InventoryAlertDto {
    private Long   productId;
    private String sku;
    private String productName;
    private Long   branchId;
    private String branchName;
    private int    stock;
    private int    minStock;
    /** critical | warning | info */
    private String severity;
    private String note;
}
