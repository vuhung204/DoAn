package com.laptopshop.application.admin.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Một điểm trên biểu đồ doanh thu theo thời gian.
 * Server trả số nguyên VND (BigDecimal, scale=0); frontend tự format thành "triệu ₫".
 */
@Getter
@AllArgsConstructor
public class RevenuePointDto {
    /** Ngày tương ứng với điểm dữ liệu */
    private LocalDate date;

    /** Label hiển thị, ví dụ: "01/07", "Tuần 27", "Tháng 7" */
    private String label;

    /** Doanh thu (VND, BigDecimal precision=15 scale=0) */
    private BigDecimal revenue;
}