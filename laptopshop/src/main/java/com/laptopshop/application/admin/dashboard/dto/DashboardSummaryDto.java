package com.laptopshop.application.admin.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * Payload tổng hợp cho GET /admin/dashboard/summary.
 * Một request duy nhất trả toàn bộ dữ liệu cần thiết cho Dashboard page load.
 */
@Getter
@AllArgsConstructor
public class DashboardSummaryDto {

    /** Stat cards: doanh thu hôm nay, số đơn, tồn kho thấp, khách hàng mới */
    private List<DashboardStatDto> stats;

    /** Time series doanh thu theo ngày (mặc định 7 ngày gần nhất) */
    private List<RevenuePointDto> revenueSeries;

    /** Doanh thu theo chi nhánh */
    private List<BranchRevenueDto> branchRevenues;

    /** Phân bố trạng thái đơn hàng cho PieChart */
    private List<OrderStatusCountDto> orderStatusCounts;

    /** Preview top-N tồn kho thấp (thường 5–10 dòng) */
    private PageDto<LowStockItemDto> lowStockPreview;
}
