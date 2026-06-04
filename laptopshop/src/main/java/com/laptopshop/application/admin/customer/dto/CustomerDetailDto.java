package com.laptopshop.application.admin.customer.dto;

import com.laptopshop.application.admin.dashboard.dto.PageDto;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Chi tiết đầy đủ một khách hàng.
 * ordersPreview: page đầu tiên (size 5) đơn hàng gần nhất.
 */
@Getter
@AllArgsConstructor
public class CustomerDetailDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    /** Địa chỉ mặc định (text đầy đủ) — null nếu chưa có */
    private String primaryAddress;
    /** "active" | "locked" | "unverified" */
    private String status;
    /** "new" | "vip" | "regular" */
    private String type;
    private Integer totalOrders;
    /** Tổng chi tiêu VND */
    private BigDecimal totalSpent;
    /** totalSpent / totalOrders — null nếu chưa có đơn */
    private BigDecimal avgPerOrder;
    private LocalDate joined;
    private List<AddressDto> addresses;
    private PageDto<OrderSummaryDto> ordersPreview;
}
