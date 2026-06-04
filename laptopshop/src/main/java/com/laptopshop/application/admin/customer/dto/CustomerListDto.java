package com.laptopshop.application.admin.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Một dòng trong danh sách khách hàng (CustomerTable).
 *
 * type phân loại:
 *   "new"     — joined trong 30 ngày gần nhất
 *   "vip"     — totalSpent >= ngưỡng VIP (ví dụ 10 triệu) hoặc >= 5 đơn
 *   "regular" — còn lại
 *
 * status mapping:
 *   UserStatus.ACTIVE     → "active"
 *   UserStatus.LOCKED     → "locked"
 *   UserStatus.UNVERIFIED → "unverified"
 */
@Getter
@AllArgsConstructor
public class CustomerListDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private Integer totalOrders;
    /** Tổng chi tiêu VND */
    private BigDecimal totalSpent;
    /** "new" | "vip" | "regular" */
    private String type;
    /** "active" | "locked" | "unverified" */
    private String status;
    private LocalDate joined;
}
