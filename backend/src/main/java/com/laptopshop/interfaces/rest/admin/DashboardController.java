package com.laptopshop.interfaces.rest.admin;

import com.laptopshop.application.admin.dashboard.dto.*;
import com.laptopshop.application.admin.dashboard.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Dashboard REST API — prefix: /admin/dashboard
 * Permissions:
 *  - read (summary/stats/order-status/low-stock): SUPER_ADMIN, STORE_MANAGER, SALES_STAFF
 *  - revenue/branches (analytics):                SUPER_ADMIN, STORE_MANAGER
 *  - export:                                      SUPER_ADMIN, STORE_MANAGER
 *  - low-stock detail:                            SUPER_ADMIN, STORE_MANAGER
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final AdminDashboardService adminDashboardService;

    // ══════════════════════════════════════════════════════════════════════
    // GET /admin/dashboard/summary
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Trả toàn bộ dữ liệu Dashboard trong 1 request.
     * Dùng cho page load đầu tiên.
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STORE_MANAGER', 'SALES_STAFF')")
    public ResponseEntity<DashboardSummaryDto> getSummary(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,

            @RequestParam(required = false) Long storeId
    ) {
        return ResponseEntity.ok(
                adminDashboardService.getDashboardSummary(startDate, endDate, storeId)
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // GET /admin/dashboard/stats
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Trả mảng stat cards (doanh thu, số đơn, tồn kho thấp, khách mới).
     * date mặc định = hôm nay.
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STORE_MANAGER', 'SALES_STAFF')")
    public ResponseEntity<List<DashboardStatDto>> getStats(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,

            @RequestParam(required = false) Long storeId
    ) {
        return ResponseEntity.ok(
                adminDashboardService.getStats(date, storeId)
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // GET /admin/dashboard/revenue
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Time series doanh thu theo ngày/tuần/tháng.
     * startDate và endDate bắt buộc.
     */
    @GetMapping("/revenue")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STORE_MANAGER')")
    public ResponseEntity<List<RevenuePointDto>> getRevenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,

            @RequestParam(required = false) Long storeId,

            @RequestParam(defaultValue = "day") String granularity
    ) {
        return ResponseEntity.ok(
                adminDashboardService.getRevenueSeries(startDate, endDate, storeId, granularity)
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // GET /admin/dashboard/branches
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Doanh thu theo chi nhánh, top N.
     */
    @GetMapping("/branches")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STORE_MANAGER')")
    public ResponseEntity<List<BranchRevenueDto>> getBranches(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,

            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) Integer limit
    ) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(6);
        LocalDate end   = endDate   != null ? endDate   : LocalDate.now();

        return ResponseEntity.ok(
                adminDashboardService.getBranchRevenues(start, end, storeId, limit)
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // GET /admin/dashboard/order-status
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Phân bố trạng thái đơn hàng — dùng vẽ PieChart.
     */
    @GetMapping("/order-status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STORE_MANAGER', 'SALES_STAFF')")
    public ResponseEntity<List<OrderStatusCountDto>> getOrderStatus(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,

            @RequestParam(required = false) Long storeId
    ) {
        return ResponseEntity.ok(
                adminDashboardService.getOrderStatusCounts(startDate, endDate, storeId)
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // GET /admin/dashboard/low-stock
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Danh sách sản phẩm tồn kho thấp (có paging).
     * threshold: override ngưỡng min_quantity nếu cần.
     */
    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STORE_MANAGER')")
    public ResponseEntity<PageDto<LowStockItemDto>> getLowStock(
            @RequestParam(required = false) Long storeId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Integer threshold
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(
                adminDashboardService.getLowStockItems(storeId, pageable, threshold)
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // GET /admin/dashboard/export
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Xuất báo cáo Excel.
     * type = REVENUE | ORDERS | INVENTORY (default = REVENUE)
     * Response: file .xlsx với Content-Disposition attachment.
     */
    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STORE_MANAGER')")
    public ResponseEntity<byte[]> exportReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long storeId,
            @RequestParam(defaultValue = "REVENUE") String type
    ) {
        ExportRequestDto req = new ExportRequestDto(startDate, endDate, storeId, type);
        byte[] fileBytes = adminDashboardService.exportReport(req);

        String filename = "dashboard-" + type.toLowerCase()
                + "-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(
                MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(fileBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(fileBytes);
    }
}
