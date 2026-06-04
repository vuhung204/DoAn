package com.laptopshop.application.admin.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Một dòng trong danh sách tồn kho thấp (LowStockAlert).
 */
@Getter
@AllArgsConstructor
public class LowStockItemDto {
    private Long productId;
    private String sku;
    private String name;
    private Long storeId;
    private String storeName;
    /** Tồn kho hiện tại */
    private Integer stock;
    /** Ngưỡng tối thiểu được cấu hình */
    private Integer minQuantity;
    /**
     * Mức cảnh báo:
     *  "critical"  — stock == 0
     *  "warning"   — 0 < stock <= minQuantity
     *  "ok"        — stock > minQuantity (không nên xuất hiện trong list này nhưng để an toàn)
     */
    private String status;
}