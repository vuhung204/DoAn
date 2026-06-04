package com.laptopshop.application.admin.revenue.service;

import com.laptopshop.application.admin.revenue.dto.*;

import java.time.LocalDate;
import java.util.List;

public interface RevenueService {

    /**
     * Aggregated payload cho Revenue page load.
     * mode = "day" | "month" | "year"
     */
    RevenueSummaryDto getSummary(String mode, LocalDate startDate, LocalDate endDate,
                                 List<Long> branchIds);

    /**
     * Time-series rows (label, storeId, storeKey, revenue).
     * Frontend pivot sang multi-line chart.
     */
    List<RevenueSeriesPointDto> getSeries(String mode, LocalDate startDate, LocalDate endDate,
                                          List<Long> branchIds);

    /**
     * Top N chi nhánh theo doanh thu; limit null = tất cả.
     */
    List<BranchRevenueDto> getBranchRevenues(LocalDate startDate, LocalDate endDate,
                                             Integer limit);

    /**
     * So sánh doanh thu 2 kỳ per branch.
     * sortBy = "revenue" | "growth" | "share"
     */
    List<BranchComparisonDto> compareBranches(String mode,
                                              LocalDate curStart, LocalDate curEnd,
                                              LocalDate prevStart, LocalDate prevEnd,
                                              String sortBy, Integer limit);

    /**
     * Doanh thu theo năm cho YearlyBarChart.
     */
    List<YearlyRevenueDto> getYearlyRevenue(int startYear, int endYear);

    /**
     * Xuất báo cáo Excel — trả byte[]; controller gắn Content-Disposition.
     */
    byte[] exportRevenue(RevenueExportRequestDto request);
}
