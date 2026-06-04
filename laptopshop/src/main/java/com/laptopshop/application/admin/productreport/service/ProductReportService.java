package com.laptopshop.application.admin.productreport.service;


import com.laptopshop.application.admin.dashboard.dto.PageDto;
import com.laptopshop.application.admin.productreport.dto.*;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface ProductReportService {

    /**
     * Aggregated payload cho Product Report page load.
     * period = "week" | "month" | "quarter"
     */
    ProductReportSummaryDto getSummary(String period, LocalDate endDate,
                                       Long storeId, Long categoryId);

    /**
     * Stat cards: tổng SP, SP đang bán, tồn kho thấp, doanh thu kỳ, đơn vị đã bán.
     */
    List<ProductStatDto> getProductStats(String period, LocalDate startDate,
                                         LocalDate endDate, Long storeId);

    /**
     * Top N sản phẩm bán chạy nhất.
     * limit mặc định = 5.
     */
    List<TopProductDto> getTopProducts(String period, LocalDate startDate,
                                       LocalDate endDate, Long storeId,
                                       Long categoryId, int limit);

    /**
     * Sản phẩm tồn kho quá mức (overstock).
     * monthsThreshold: số tháng hàng tồn tối thiểu để coi là overstock (default 6).
     */
    PageDto<OverstockItemDto> getOverstockItems(LocalDate startDate, LocalDate endDate,
                                                Long storeId, Pageable pageable,
                                                int monthsWindow, int monthsThreshold);

    /**
     * Sản phẩm không bán được trong lookback period (deadstock).
     * lookbackDays: số ngày nhìn lại (default 28).
     */
    PageDto<DeadStockItemDto> getDeadStockItems(int lookbackDays, Long storeId,
                                                Pageable pageable);

    /**
     * Phân bổ doanh thu theo danh mục.
     */
    List<CategoryBreakdownDto> getCategoryBreakdown(LocalDate startDate, LocalDate endDate,
                                                    Long storeId);

    /**
     * Xuất báo cáo Excel — trả byte[]; controller gắn Content-Disposition.
     */
    byte[] exportReport(ProductReportExportRequestDto request);
}
