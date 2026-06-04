package com.laptopshop.application.admin.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter @AllArgsConstructor
public class InventoryHistoryDto {
    private Long          id;
    private Long          productId;
    private Long          branchId;
    private int           delta;
    /** IMPORT|EXPORT|ADJUSTMENT|SALE|TRANSFER_OUT|TRANSFER_IN|ORDER_DEDUCT|RETURN_IN */
    private String        actionType;
    private String        refId;
    private LocalDateTime createdAt;
    private Long          createdBy;
    private String        note;
}
