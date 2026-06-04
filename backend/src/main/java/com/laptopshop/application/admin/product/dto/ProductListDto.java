package com.laptopshop.application.admin.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Một hàng trong ProductTable.
 * stock: tổng tồn kho tất cả chi nhánh (SUM store_inventory.quantity).
 * minStock: min_quantity nhỏ nhất trong các chi nhánh.
 * visible: map Product.isActive.
 */
@Getter
@AllArgsConstructor
public class ProductListDto {
    private Long id;
    private String name;
    private String sku;
    private String brand;
    private String category;
    /** Giá gốc VND */
    private Long basePrice;
    /** Giá khuyến mãi VND — null nếu không có */
    private Long salePrice;
    /** Tổng tồn kho tất cả chi nhánh */
    private Integer stock;
    /** Ngưỡng tồn tối thiểu */
    private Integer minStock;
    private Boolean visible;
    private String primaryImageUrl;
}
