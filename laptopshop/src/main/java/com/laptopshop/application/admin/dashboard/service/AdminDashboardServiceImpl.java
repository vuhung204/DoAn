package com.laptopshop.application.admin.dashboard.service;


import com.laptopshop.application.admin.dashboard.dto.*;
import com.laptopshop.domain.inventory.entity.StoreInventory;
import com.laptopshop.domain.inventory.repository.StoreInventoryRepository;
import com.laptopshop.domain.order.entity.Order;
import com.laptopshop.domain.order.enums.OrderStatus;
import com.laptopshop.domain.order.repository.OrderRepository;
import com.laptopshop.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final OrderRepository orderRepository;
    private final StoreInventoryRepository storeInventoryRepository;
    private final UserRepository userRepository;

    private static final Map<OrderStatus, String> STATUS_COLORS = Map.of(
            OrderStatus.PENDING,    "#9ca3af",
            OrderStatus.CONFIRMED,  "#2563eb",
            OrderStatus.PROCESSING, "#f59e0b",
            OrderStatus.SHIPPING,   "#03A9F4",
            OrderStatus.COMPLETED,  "#10b981",
            OrderStatus.CANCELLED,  "#F44336",
            OrderStatus.REFUNDED,   "#FF5722"
    );

    private static final Map<OrderStatus, String> STATUS_LABELS = Map.of(
            OrderStatus.PENDING,    "Chờ xác nhận",
            OrderStatus.CONFIRMED,  "Đã xác nhận",
            OrderStatus.PROCESSING, "Đang xử lý",
            OrderStatus.SHIPPING,   "Đang giao",
            OrderStatus.COMPLETED,  "Hoàn thành",
            OrderStatus.CANCELLED,  "Đã huỷ",
            OrderStatus.REFUNDED,   "Đã hoàn tiền"
    );

    private LocalDateTime startOfDay(LocalDate d) { return d.atStartOfDay(); }
    private LocalDateTime endOfDay(LocalDate d)   { return d.atTime(LocalTime.MAX); }
    private LocalDate todayOrDefault(LocalDate d)  { return d != null ? d : LocalDate.now(); }

    private String calcTrend(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) return "";
        double pct = current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .doubleValue() * 100;
        return String.format("%+.1f%%", pct);
    }

    private String trendClass(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) return "neutral";
        return current.compareTo(previous) >= 0 ? "up" : "down";
    }

    private String trendClassLong(long current, long previous) {
        if (previous == 0) return "neutral";
        return current >= previous ? "up" : "down";
    }

    private String calcTrendLong(long current, long previous) {
        if (previous == 0) return "";
        double pct = (double)(current - previous) / previous * 100;
        return String.format("%+.1f%%", pct);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 1. getDashboardSummary
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public DashboardSummaryDto getDashboardSummary(LocalDate startDate, LocalDate endDate,
                                                   Long storeId) {
        LocalDate today = LocalDate.now();
        LocalDate start = startDate != null ? startDate : today.minusDays(6);
        LocalDate end   = endDate   != null ? endDate   : today;

        return new DashboardSummaryDto(
                getStats(today, storeId),
                getRevenueSeries(start, end, storeId, "day"),
                getBranchRevenues(start, end, storeId, 10),
                getOrderStatusCounts(start, end, storeId),
                getLowStockItems(storeId, PageRequest.of(0, 5), null)
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. getStats — 4 stat cards với trend thực
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public List<DashboardStatDto> getStats(LocalDate date, Long storeId) {
        LocalDate target    = todayOrDefault(date);
        LocalDate yesterday = target.minusDays(1);

        LocalDateTime startToday = startOfDay(target);
        LocalDateTime endToday   = endOfDay(target);
        LocalDateTime startYest  = startOfDay(yesterday);
        LocalDateTime endYest    = endOfDay(yesterday);

        // Doanh thu
        BigDecimal revenue      = orderRepository.sumTotalAmountByDateRangeAndStore(startToday, endToday, storeId);
        BigDecimal revenueYest  = orderRepository.sumTotalAmountByDateRangeAndStore(startYest, endYest, storeId);

        // Đơn hàng
        long orders      = orderRepository.countOrdersByDateRangeAndStore(startToday, endToday, storeId);
        long ordersYest  = orderRepository.countOrdersByDateRangeAndStore(startYest, endYest, storeId);

        // Tồn kho thấp (không có khái niệm trend theo ngày)
        long lowStock = storeInventoryRepository.countLowStockItems(storeId);

        // Khách mới
        long newUsers     = userRepository.countNewUsersBetween(startToday, endToday);
        long newUsersYest = userRepository.countNewUsersBetween(startYest, endYest);

        NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));

        return List.of(
                new DashboardStatDto(
                        "Doanh thu hôm nay",
                        nf.format(revenue) + " ₫",
                        calcTrend(revenue, revenueYest),
                        trendClass(revenue, revenueYest),
                        "payments",
                        "icon-revenue"
                ),
                new DashboardStatDto(
                        "Số đơn hôm nay",
                        String.valueOf(orders),
                        calcTrendLong(orders, ordersYest),
                        trendClassLong(orders, ordersYest),
                        "shopping_cart",
                        "icon-orders"
                ),
                new DashboardStatDto(
                        "Tồn kho thấp",
                        lowStock + " sản phẩm",
                        lowStock > 0 ? "Cảnh báo" : "Bình thường",
                        lowStock > 0 ? "warn" : "neutral",
                        "inventory",
                        "icon-inventory"
                ),
                new DashboardStatDto(
                        "Khách hàng mới",
                        String.valueOf(newUsers),
                        calcTrendLong(newUsers, newUsersYest),
                        trendClassLong(newUsers, newUsersYest),
                        "people",
                        "icon-users"
                )
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // 3. getRevenueSeries
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public List<RevenuePointDto> getRevenueSeries(LocalDate startDate, LocalDate endDate,
                                                  Long storeId, String granularity) {
        LocalDateTime start = startOfDay(startDate);
        LocalDateTime end   = endOfDay(endDate);
        DateTimeFormatter labelFmt = DateTimeFormatter.ofPattern("dd/MM");

        List<Object[]> rows = orderRepository.findRevenueGroupedByDate(start, end, storeId);

        return rows.stream().map(r -> {
            LocalDate d = ((java.sql.Date) r[0]).toLocalDate();
            BigDecimal rev = r[1] != null ? new BigDecimal(r[1].toString()) : BigDecimal.ZERO;
            return new RevenuePointDto(d, d.format(labelFmt), rev);
        }).collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════════════
    // 4. getBranchRevenues — FIX: truyền storeId xuống query
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public List<BranchRevenueDto> getBranchRevenues(LocalDate startDate, LocalDate endDate,
                                                    Long storeId, Integer limit) {
        LocalDateTime start = startOfDay(startDate);
        LocalDateTime end   = endOfDay(endDate);
        int topN = (limit != null && limit > 0) ? limit : Integer.MAX_VALUE;

        List<Object[]> rows = orderRepository.findRevenueGroupedByStore(start, end, storeId, topN);

        return rows.stream().map(r -> {
            Long      sId  = ((Number) r[0]).longValue();
            String    name = (String) r[1];
            BigDecimal rev = r[2] != null ? new BigDecimal(r[2].toString()) : BigDecimal.ZERO;
            return new BranchRevenueDto(sId, name, rev);
        }).collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════════════
    // 5. getOrderStatusCounts
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public List<OrderStatusCountDto> getOrderStatusCounts(LocalDate startDate, LocalDate endDate,
                                                          Long storeId) {
        LocalDate today = LocalDate.now();
        LocalDateTime start = startOfDay(startDate != null ? startDate : today);
        LocalDateTime end   = endOfDay(endDate     != null ? endDate   : today);

        List<Object[]> rows = orderRepository.countOrderByStatus(start, end, storeId);

        return rows.stream().map(r -> {
            OrderStatus status = (OrderStatus) r[0];
            int count          = ((Number) r[1]).intValue();
            return new OrderStatusCountDto(
                    status.name(),
                    STATUS_LABELS.getOrDefault(status, status.name()),
                    count,
                    STATUS_COLORS.getOrDefault(status, "#9E9E9E")
            );
        }).collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════════════
    // 6. getLowStockItems
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public PageDto<LowStockItemDto> getLowStockItems(Long storeId, Pageable pageable,
                                                     Integer threshold) {
        Page<Object[]> page = storeInventoryRepository.findLowStockItems(storeId, threshold, pageable);

        List<LowStockItemDto> content = page.getContent().stream().map(r -> {
            Long    productId   = ((Number) r[0]).longValue();
            String  sku         = (String)  r[1];
            String  productName = (String)  r[2];
            Long    sId         = ((Number) r[3]).longValue();
            String  storeName   = (String)  r[4];
            int     stock       = ((Number) r[5]).intValue();
            int     minQty      = ((Number) r[6]).intValue();
            return new LowStockItemDto(productId, sku, productName, sId, storeName,
                    stock, minQty, resolveStockStatus(stock, minQty));
        }).collect(Collectors.toList());

        return PageDto.from(new PageImpl<>(content, pageable, page.getTotalElements()));
    }

    private String resolveStockStatus(int stock, int minQty) {
        if (stock == 0)      return "critical";
        if (stock <= minQty) return "warning";
        return "ok";
    }

    // ══════════════════════════════════════════════════════════════════════
    // 7. exportReport
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public byte[] exportReport(ExportRequestDto request) {
        return switch (request.getType().toUpperCase()) {
            case "ORDERS"    -> exportOrders(request);
            case "INVENTORY" -> exportInventory(request);
            default          -> exportRevenue(request);
        };
    }

    private byte[] exportRevenue(ExportRequestDto req) {
        List<RevenuePointDto> series = getRevenueSeries(
                req.getStartDate(), req.getEndDate(), req.getStoreId(), "day");
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Doanh thu");
            CellStyle hs = buildHeaderStyle(wb);
            CellStyle ns = buildNumberStyle(wb);
            Row header = sheet.createRow(0);
            createCell(header, 0, "Ngày", hs);
            createCell(header, 1, "Doanh thu (₫)", hs);
            sheet.setColumnWidth(0, 4000); sheet.setColumnWidth(1, 7000);
            int i = 1;
            for (RevenuePointDto p : series) {
                Row row = sheet.createRow(i++);
                createCell(row, 0, p.getDate().toString(), null);
                Cell c = row.createCell(1); c.setCellValue(p.getRevenue().doubleValue()); c.setCellStyle(ns);
            }
            wb.write(out); return out.toByteArray();
        } catch (Exception e) { log.error("Export revenue failed", e); throw new RuntimeException("Không thể xuất báo cáo doanh thu", e); }
    }

    private byte[] exportOrders(ExportRequestDto req) {
        List<Order> orders = orderRepository.findOrdersForExport(
                startOfDay(req.getStartDate()), endOfDay(req.getEndDate()), req.getStoreId());
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Đơn hàng");
            CellStyle hs = buildHeaderStyle(wb); CellStyle ns = buildNumberStyle(wb);
            Row header = sheet.createRow(0);
            String[] cols = {"Mã đơn","Khách hàng","Chi nhánh","Trạng thái","Tổng tiền (₫)","Ngày đặt"};
            for (int i = 0; i < cols.length; i++) { createCell(header, i, cols[i], hs); sheet.setColumnWidth(i, 5000); }
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            int i = 1;
            for (Order o : orders) {
                Row row = sheet.createRow(i++);
                createCell(row, 0, o.getOrderCode(), null);
                createCell(row, 1, o.getUser().getFullName(), null);
                createCell(row, 2, o.getStore().getName(), null);
                createCell(row, 3, STATUS_LABELS.getOrDefault(o.getStatus(), o.getStatus().name()), null);
                Cell c = row.createCell(4); c.setCellValue(o.getTotalAmount().doubleValue()); c.setCellStyle(ns);
                createCell(row, 5, o.getOrderedAt().format(fmt), null);
            }
            wb.write(out); return out.toByteArray();
        } catch (Exception e) { log.error("Export orders failed", e); throw new RuntimeException("Không thể xuất báo cáo đơn hàng", e); }
    }

    private byte[] exportInventory(ExportRequestDto req) {
        List<StoreInventory> items = storeInventoryRepository.findAllForExport(req.getStoreId());
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Tồn kho");
            CellStyle hs = buildHeaderStyle(wb);
            Row header = sheet.createRow(0);
            String[] cols = {"SKU","Tên sản phẩm","Chi nhánh","Tồn kho","Ngưỡng tối thiểu","Trạng thái"};
            for (int i = 0; i < cols.length; i++) { createCell(header, i, cols[i], hs); sheet.setColumnWidth(i, 5000); }
            int i = 1;
            for (StoreInventory si : items) {
                Row row = sheet.createRow(i++);
                createCell(row, 0, si.getProduct().getSku(), null);
                createCell(row, 1, si.getProduct().getName(), null);
                createCell(row, 2, si.getStore().getName(), null);
                row.createCell(3).setCellValue(si.getQuantity());
                row.createCell(4).setCellValue(si.getMinQuantity());
                createCell(row, 5, resolveStockStatus(si.getQuantity(), si.getMinQuantity()), null);
            }
            wb.write(out); return out.toByteArray();
        } catch (Exception e) { log.error("Export inventory failed", e); throw new RuntimeException("Không thể xuất báo cáo tồn kho", e); }
    }

    private CellStyle buildHeaderStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle(); Font f = wb.createFont(); f.setBold(true); s.setFont(f);
        s.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setBorderBottom(BorderStyle.THIN); return s;
    }

    private CellStyle buildNumberStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        s.setDataFormat(wb.createDataFormat().getFormat("#,##0")); return s;
    }

    private void createCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col); cell.setCellValue(value != null ? value : "");
        if (style != null) cell.setCellStyle(style);
    }
}
