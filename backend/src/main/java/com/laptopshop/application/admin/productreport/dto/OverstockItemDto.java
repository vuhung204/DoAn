package com.laptopshop.application.admin.productreport.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Một sản phẩm tồn kho quá mức (overstock).
 * monthsOfStock = totalStock / estMonthlySales
 * Nếu estMonthlySales == 0 → monthsOfStock = null (đánh dấu deadstock candidate)
 */
@Getter
@AllArgsConstructor
public class OverstockItemDto {
    private Long productId;
    private String sku;
    private String name;
    private Long storeId;
    private String storeName;
    /** Tồn kho hiện tại */
    private Integer totalStock;
    /** Doanh số TB ước tính (đơn vị/tháng) */
    private BigDecimal estMonthlySales;
    /**
     * Số tháng hàng tồn = totalStock / estMonthlySales.
     * null nếu không có doanh số (divide-by-zero guard).
     */
    private BigDecimal monthsOfStock;
    /** Label hiển thị, ví dụ: "TB: 8/tháng" */
    private String formattedAvg;
}
