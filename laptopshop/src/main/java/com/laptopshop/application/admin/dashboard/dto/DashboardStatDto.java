package com.laptopshop.application.admin.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Một stat card trên Dashboard.
 * Ví dụ: label="Doanh thu hôm nay", value="125.000.000 ₫", trend="+12%", trendClass="up"
 */
@Getter
@AllArgsConstructor
public class DashboardStatDto {
    /** Tên chỉ số hiển thị, ví dụ: "Doanh thu hôm nay" */
    private String label;

    /** Giá trị đã format sẵn (VND), ví dụ: "125.000.000 ₫" */
    private String value;

    /** Chuỗi trend, ví dụ: "+12%" */
    private String trend;

    /** CSS class cho trend: "up" | "down" | "neutral" */
    private String trendClass;

    /** Tên icon (material/fontawesome), ví dụ: "shopping_cart" */
    private String icon;

    /** CSS class cho icon, ví dụ: "icon-revenue" */
    private String iconClass;
}
