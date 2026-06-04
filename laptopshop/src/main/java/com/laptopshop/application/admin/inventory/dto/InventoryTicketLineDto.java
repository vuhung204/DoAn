package com.laptopshop.application.admin.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class InventoryTicketLineDto {
    private Long       productId;
    private String     sku;
    private String     name;
    private int        qty;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
}
