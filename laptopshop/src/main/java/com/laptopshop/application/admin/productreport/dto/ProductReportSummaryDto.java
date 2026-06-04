package com.laptopshop.application.admin.productreport.dto;


import com.laptopshop.application.admin.dashboard.dto.PageDto;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * Aggregated payload cho GET /admin/products/report/summary.
 * Một request duy nhất trả toàn bộ dữ liệu cần thiết cho Product Report page load.
 */
@Getter
@AllArgsConstructor
public class ProductReportSummaryDto {
    /** Stat cards: tổng SP, SP đang bán, tồn kho thấp, doanh thu kỳ */
    private List<ProductStatDto> statCards;
    /** Top 5 sản phẩm bán chạy */
    private List<TopProductDto> topProductsPreview;
    /** Preview top-5 overstock */
    private PageDto<OverstockItemDto> overstockPreview;
    /** Preview top-5 deadstock */
    private PageDto<DeadStockItemDto> deadstockPreview;
    /** Phân bổ doanh thu theo danh mục */
    private List<CategoryBreakdownDto> categoryBreakdownSnapshot;
}
