package com.laptopshop.application.admin.customer.service;

import com.laptopshop.application.admin.customer.dto.*;
import com.laptopshop.application.admin.dashboard.dto.PageDto;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface AdminCustomerService {

    /**
     * KPI stat cards: totalCustomers, newCustomers, hotCustomers, lockedAccounts.
     * period = "week" | "month" | "quarter"
     */
    CustomerStatsSummaryDto getStats(String period, LocalDate endDate, Long storeId);

    /**
     * Danh sách khách hàng có search + filter + pagination.
     * q      = search string (name/email/phone), null = bỏ qua
     * status = "active" | "locked" | "unverified" | null = tất cả
     * type   = "new" | "vip" | "regular" | null = tất cả
     */
    PageDto<CustomerListDto> searchCustomers(String q, String status, String type,
                                             Pageable pageable, Long storeId);

    /**
     * Top N khách hàng chi tiêu nhiều nhất trong kỳ.
     */
    List<TopCustomerDto> getTopCustomers(LocalDate startDate, LocalDate endDate,
                                         int limit, Long storeId);

    /**
     * Chi tiết đầy đủ 1 khách hàng kèm addresses và orders preview.
     */
    CustomerDetailDto getCustomerDetail(Long id);

    /**
     * Lịch sử đơn hàng phân trang của 1 khách.
     */
    PageDto<OrderSummaryDto> getCustomerOrders(Long customerId, Pageable pageable);

    /**
     * Cập nhật trạng thái tài khoản (ACTIVE / LOCKED / UNVERIFIED).
     */
    void updateCustomerStatus(Long id, UpdateCustomerStatusRequestDto req);

    /**
     * Reset mật khẩu — gửi email và/hoặc trả temp password.
     */
    ResetPasswordResponseDto resetPassword(Long id);

    /**
     * Xuất báo cáo Excel danh sách / chi tiết khách hàng.
     */
    byte[] exportCustomers(CustomerExportRequestDto req);
}
