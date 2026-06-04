package com.laptopshop.application.admin.revenue.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * Aggregated payload cho GET /admin/revenue/summary.
 * Một request duy nhất trả toàn bộ dữ liệu cho Revenue page load.
 */
@Getter
@AllArgsConstructor
public class RevenueSummaryDto {
    /** KPI cards: tổng doanh thu, TB/ngày, tổng đơn, AOV */
    private List<RevenueKpiDto> kpis;

    /**
     * Time-series rows: (label, storeId, storeKey, revenue).
     * Frontend pivot sang multi-series chart.
     */
    private List<RevenueSeriesPointDto> series;

    /** Top N chi nhánh theo doanh thu */
    private List<BranchRevenueDto> topBranches;

    /** Snapshot so sánh 2 kỳ per branch */
    private List<BranchComparisonDto> branchComparisonSnapshot;
}