package com.laptopshop.application.admin.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Số lượng đơn hàng theo trạng thái — dùng vẽ PieChart.
 * Bao gồm cả DB status lẫn label/color để frontend không cần map thêm.
 */
@Getter
@AllArgsConstructor
public class OrderStatusCountDto {
    /** DB enum value: PENDING, CONFIRMED, PROCESSING, SHIPPING, DELIVERED, COMPLETED, CANCELLED, REFUNDED */
    private String status;

    /** Label tiếng Việt hiển thị trên UI */
    private String label;

    /** Số lượng đơn */
    private Integer count;

    /** Màu hex cho PieChart slice, ví dụ: "#4CAF50" */
    private String color;
}