package com.laptopshop.application.admin.dashboard.service;

import com.laptopshop.application.admin.dashboard.dto.*;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface AdminDashboardService {

    /**
     * Trả toàn bộ dữ liệu Dashboard trong 1 request (dùng cho page load).
     * startDate/endDate mặc định = hôm nay - 6 ngày đến hôm nay nếu null.
     */
    DashboardSummaryDto getDashboardSummary(LocalDate startDate, LocalDate endDate, Long storeId);

    /**
     * Stat cards: doanh thu hôm nay, số đơn, tồn kho thấp, khách hàng mới.
     * Tự động tính trend so với hôm qua.
     * date mặc định = hôm nay nếu null.
     */
    List<DashboardStatDto> getStats(LocalDate date, Long storeId);

    /**
     * Time series doanh thu theo ngày.
     * granularity hiện tại chỉ hỗ trợ "day".
     */
    List<RevenuePointDto> getRevenueSeries(LocalDate startDate, LocalDate endDate,
                                           Long storeId, String granularity);

    /**
     * Doanh thu theo chi nhánh, top limit.
     * limit = null → tất cả chi nhánh.
     * storeId = null → tất cả chi nhánh.
     */
    List<BranchRevenueDto> getBranchRevenues(LocalDate startDate, LocalDate endDate,
                                             Long storeId, Integer limit);

    /**
     * Phân bố trạng thái đơn hàng cho PieChart.
     * startDate/endDate mặc định = hôm nay nếu null.
     */
    List<OrderStatusCountDto> getOrderStatusCounts(LocalDate startDate, LocalDate endDate,
                                                   Long storeId);

    /**
     * Danh sách tồn kho thấp (có paging).
     * threshold = null → dùng min_quantity của từng record.
     */
    PageDto<LowStockItemDto> getLowStockItems(Long storeId, Pageable pageable, Integer threshold);

    /**
     * Sinh file Excel.
     * type = REVENUE | ORDERS | INVENTORY (default = REVENUE).
     */
    byte[] exportReport(ExportRequestDto request);
}
