package com.laptopshop.application.admin.productreport.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Sản phẩm không có giao dịch trong lookback period (dead stock).
 * lastSoldAt = null nếu chưa bán lần nào.
 */
@Getter
@AllArgsConstructor
public class DeadStockItemDto {
    private Long productId;
    private String sku;
    private String name;
    private Long storeId;
    private String storeName;
    /** Tồn kho hiện tại */
    private Integer totalStock;
    /** Lần bán cuối — null nếu chưa bao giờ bán */
    private LocalDateTime lastSoldAt;
    /** Label thân thiện: "2 tháng trước", "Chưa từng bán" */
    private String formattedLastSale;
    /** Giá bán hiện tại VND (sale_price hoặc base_price) */
    private BigDecimal price;
}
