package com.laptopshop.application.admin.revenue.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Một KPI card trên trang Revenue.
 * Ví dụ: label="Tổng doanh thu tháng này", formattedValue="16,8 T đ", value=16800000000, growth="+8.3%"
 */
@Getter
@AllArgsConstructor
public class RevenueKpiDto {
    /** Tên chỉ số, ví dụ: "Tổng doanh thu", "Doanh thu TB/ngày" */
    private String label;

    /** Giá trị đã format sẵn theo mode: "16,8 T đ" (year/month) hoặc "125 Tr đ" (day) */
    private String formattedValue;

    /** Giá trị thô VND — BigDecimal precision=15 scale=0 */
    private BigDecimal value;

    /** Tăng trưởng so kỳ trước, ví dụ: "+8.3%" hoặc "-2.1%" */
    private String growth;
}
