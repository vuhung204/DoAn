package com.laptopshop.application.admin.productreport.service;


import com.laptopshop.application.admin.dashboard.dto.PageDto;
import com.laptopshop.application.admin.productreport.dto.*;
import com.laptopshop.domain.catalog.repository.ProductRepository;
import com.laptopshop.domain.inventory.repository.StoreInventoryRepository;
import com.laptopshop.domain.order.repository.OrderItemRepository;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductReportServiceImpl implements ProductReportService {

    private final OrderItemRepository orderItemRepository;
    private final StoreInventoryRepository storeInventoryRepository;
    private final ProductRepository productRepository;

    // ── Màu mặc định cho category chart ──────────────────────────────────
    private static final List<String> CATEGORY_COLORS = List.of(
            "#4CAF50", "#2196F3", "#FF9800", "#9C27B0",
            "#F44336", "#00BCD4", "#795548", "#607D8B"
    );

    // ── date helpers ──────────────────────────────────────────────────────
    private LocalDateTime startOf(LocalDate d) { return d.atStartOfDay(); }
    private LocalDateTime endOf(LocalDate d)   { return d.atTime(LocalTime.MAX); }

    /**
     * Resolve startDate từ period nếu không truyền.
     * week=7d, month=30d, quarter=90d
     */
    private LocalDate resolveStart(String period, LocalDate endDate) {
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        return switch (period.toLowerCase()) {
            case "quarter" -> end.minusDays(89);
            case "month"   -> end.minusDays(29);
            default        -> end.minusDays(6); // week
        };
    }

    private List<Long> toList(Long id) {
        return id != null ? List.of(id) : null;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 1. getSummary
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public ProductReportSummaryDto getSummary(String period, LocalDate endDate,
                                              Long storeId, Long categoryId) {
        LocalDate end   = endDate != null ? endDate : LocalDate.now();
        LocalDate start = resolveStart(period, end);

        List<ProductStatDto>      stats    = getProductStats(period, start, end, storeId);
        List<TopProductDto>       top      = getTopProducts(period, start, end, storeId, categoryId, 5);
        PageDto<OverstockItemDto> overstock = getOverstockItems(start, end, storeId,
                PageRequest.of(0, 5), 3, 6);
        PageDto<DeadStockItemDto> dead     = getDeadStockItems(28, storeId, PageRequest.of(0, 5));
        List<CategoryBreakdownDto> catBreak = getCategoryBreakdown(start, end, storeId);

        return new ProductReportSummaryDto(stats, top, overstock, dead, catBreak);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. getProductStats — stat cards
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public List<ProductStatDto> getProductStats(String period, LocalDate startDate,
                                                LocalDate endDate, Long storeId) {
        LocalDate end   = endDate   != null ? endDate   : LocalDate.now();
        LocalDate start = startDate != null ? startDate : resolveStart(period, end);

        long totalProducts   = productRepository.countByIsActiveTrue();
        long lowStockCount   = storeInventoryRepository.countLowStockProducts(storeId);
        BigDecimal revenue   = orderItemRepository.sumRevenueForPeriod(
                startOf(start), endOf(end), storeId);
        Long unitsSold       = orderItemRepository.sumUnitsSoldForPeriod(
                startOf(start), endOf(end), storeId);

        return List.of(
                new ProductStatDto("Tổng sản phẩm",
                        String.valueOf(totalProducts),
                        BigDecimal.valueOf(totalProducts)),
                new ProductStatDto("Tồn kho thấp",
                        String.valueOf(lowStockCount),
                        BigDecimal.valueOf(lowStockCount)),
                new ProductStatDto("Doanh thu kỳ",
                        formatVnd(revenue),
                        revenue),
                new ProductStatDto("Sản phẩm đã bán",
                        formatUnits(unitsSold),
                        BigDecimal.valueOf(unitsSold != null ? unitsSold : 0L))
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // 3. getTopProducts
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public List<TopProductDto> getTopProducts(String period, LocalDate startDate,
                                              LocalDate endDate, Long storeId,
                                              Long categoryId, int limit) {
        LocalDate end   = endDate   != null ? endDate   : LocalDate.now();
        LocalDate start = startDate != null ? startDate : resolveStart(period, end);

        List<Long> storeIds    = toList(storeId);
        List<Long> categoryIds = toList(categoryId);

        List<Object[]> rows = orderItemRepository.aggregateSalesByProduct(
                startOf(start), endOf(end), storeIds, categoryIds, limit);

        List<TopProductDto> result = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            Object[] r = rows.get(i);
            Long      pid     = ((Number) r[0]).longValue();
            String    sku     = (String)  r[1];
            String    name    = (String)  r[2];
            Long      sold    = ((Number) r[3]).longValue();
            BigDecimal rev    = toBigDecimal(r[4]);
            BigDecimal rating = r[5] != null ? toBigDecimal(r[5]).setScale(1, RoundingMode.HALF_UP) : null;
            Integer reviews   = ((Number) r[6]).intValue();
            result.add(new TopProductDto(i + 1, pid, name, sku, sold, rev, rating, reviews));
        }
        return result;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 4. getOverstockItems
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public PageDto<OverstockItemDto> getOverstockItems(LocalDate startDate, LocalDate endDate,
                                                       Long storeId, Pageable pageable,
                                                       int monthsWindow, int monthsThreshold) {
        LocalDate end   = endDate   != null ? endDate   : LocalDate.now();
        LocalDate start = startDate != null ? startDate : end.minusMonths(monthsWindow);

        List<Long> storeIds = toList(storeId);

        // a) lấy tất cả stock rows (paged)
        Page<Object[]> stockPage = storeInventoryRepository
                .findStockRowsForOverstock(storeIds, pageable);

        // b) collect productIds từ page hiện tại để query sales
        List<Long> productIds = stockPage.getContent().stream()
                .map(r -> ((Number) r[0]).longValue())
                .distinct()
                .collect(Collectors.toList());

        // c) lấy doanh số cho các product này
        Map<Long, Long> soldMap = new HashMap<>();
        if (!productIds.isEmpty()) {
            orderItemRepository.sumUnitsByProductForPeriod(
                            startOf(start), endOf(end), storeIds, productIds)
                    .forEach(r -> soldMap.put(
                            ((Number) r[0]).longValue(),
                            ((Number) r[1]).longValue()));
        }

        // d) compute overstock, filter theo monthsThreshold
        List<OverstockItemDto> content = stockPage.getContent().stream()
                .map(r -> {
                    Long    pid        = ((Number) r[0]).longValue();
                    String  sku        = (String)  r[1];
                    String  pName      = (String)  r[2];
                    Long    sId        = ((Number) r[3]).longValue();
                    String  sName      = (String)  r[4];
                    int     stock      = ((Number) r[5]).intValue();

                    long    totalSold  = soldMap.getOrDefault(pid, 0L);
                    BigDecimal estMonthlySales = monthsWindow > 0
                            ? BigDecimal.valueOf(totalSold)
                            .divide(BigDecimal.valueOf(monthsWindow), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;

                    BigDecimal monthsOfStock = estMonthlySales.compareTo(BigDecimal.ZERO) > 0
                            ? BigDecimal.valueOf(stock)
                            .divide(estMonthlySales, 1, RoundingMode.HALF_UP)
                            : null; // null = infinite (no sales)

                    String formattedAvg = estMonthlySales.compareTo(BigDecimal.ZERO) > 0
                            ? "TB: " + estMonthlySales.setScale(0, RoundingMode.HALF_UP) + "/tháng"
                            : "Không có doanh số";

                    return new OverstockItemDto(pid, sku, pName, sId, sName,
                            stock, estMonthlySales, monthsOfStock, formattedAvg);
                })
                // chỉ lấy những gì thực sự overstock (monthsOfStock >= threshold hoặc null)
                .filter(item -> item.getMonthsOfStock() == null
                        || item.getMonthsOfStock().compareTo(BigDecimal.valueOf(monthsThreshold)) >= 0)
                .collect(Collectors.toList());

        Page<OverstockItemDto> mapped = new PageImpl<>(content, pageable, stockPage.getTotalElements());
        return PageDto.from(mapped);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 5. getDeadStockItems  — PATCHED: soldIds filter moved to service layer
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public PageDto<DeadStockItemDto> getDeadStockItems(int lookbackDays, Long storeId,
                                                       Pageable pageable) {
        LocalDate today         = LocalDate.now();
        LocalDate lookbackStart = today.minusDays(lookbackDays);
        List<Long> storeIds     = toList(storeId);

        // a) tập hợp product đã bán trong lookback — dùng default method
        List<Long> soldIds = orderItemRepository.findSoldProductIds(
                startOf(lookbackStart), endOf(today), storeIds);
        Set<Long> soldSet = new HashSet<>(soldIds);

        // b) lấy tất cả inventory còn hàng (không filter soldIds trong SQL)
        Page<Object[]> page = storeInventoryRepository
                .findDeadStockRows(storeIds, null, pageable);

        // c) last sold at
        List<Long> deadProductIds = page.getContent().stream()
                .map(r -> ((Number) r[0]).longValue())
                .distinct().collect(Collectors.toList());

        Map<Long, LocalDateTime> lastSoldMap = new HashMap<>();
        if (!deadProductIds.isEmpty()) {
            orderItemRepository.findLastSoldAtByProducts(storeIds, deadProductIds)
                    .forEach(r -> {
                        Long pid = ((Number) r[0]).longValue();
                        Object raw = r[1];
                        if (raw != null) {
                            LocalDateTime ldt = raw instanceof java.sql.Timestamp ts
                                    ? ts.toLocalDateTime()
                                    : LocalDateTime.parse(raw.toString());
                            lastSoldMap.put(pid, ldt);
                        }
                    });
        }

        // d) map + post-filter: chỉ giữ những sản phẩm KHÔNG trong soldSet
        List<DeadStockItemDto> content = page.getContent().stream()
                .filter(r -> !soldSet.contains(((Number) r[0]).longValue()))
                .map(r -> {
                    Long    pid    = ((Number) r[0]).longValue();
                    String  sku    = (String)  r[1];
                    String  pName  = (String)  r[2];
                    Long    sId    = ((Number) r[3]).longValue();
                    String  sName  = (String)  r[4];
                    int     stock  = ((Number) r[5]).intValue();
                    BigDecimal price = toBigDecimal(r[6]);

                    LocalDateTime lastSold = lastSoldMap.get(pid);
                    return new DeadStockItemDto(pid, sku, pName, sId, sName,
                            stock, lastSold, formatLastSale(lastSold), price);
                }).collect(Collectors.toList());

        return PageDto.from(new PageImpl<>(content, pageable, content.size()));
    }

    // ══════════════════════════════════════════════════════════════════════
    // 6. getCategoryBreakdown
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public List<CategoryBreakdownDto> getCategoryBreakdown(LocalDate startDate,
                                                           LocalDate endDate,
                                                           Long storeId) {
        List<Object[]> rows = orderItemRepository.aggregateByCategory(
                startOf(startDate), endOf(endDate), storeId);

        // Tổng doanh thu để tính sharePercent
        BigDecimal totalRevenue = rows.stream()
                .map(r -> toBigDecimal(r[2]))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<CategoryBreakdownDto> result = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            Object[]   r       = rows.get(i);
            Long       catId   = ((Number) r[0]).longValue();
            String     catName = (String)  r[1];
            BigDecimal rev     = toBigDecimal(r[2]);
            Long       units   = ((Number) r[3]).longValue();
            BigDecimal share   = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? rev.multiply(BigDecimal.valueOf(100))
                    .divide(totalRevenue, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            String color = i < CATEGORY_COLORS.size() ? CATEGORY_COLORS.get(i) : "#9E9E9E";
            result.add(new CategoryBreakdownDto(catId, catName, rev, units, share, color));
        }
        return result;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 7. exportReport — Apache POI
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public byte[] exportReport(ProductReportExportRequestDto req) {
        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle hs = buildHeaderStyle(wb);
            CellStyle ns = buildNumberStyle(wb);

            switch (req.getType().toUpperCase()) {
                case "TOP_PRODUCTS" -> writeTopProductsSheet(wb, req, hs, ns);
                case "OVERSTOCK"    -> writeOverstockSheet(wb, req, hs, ns);
                case "DEADSTOCK"    -> writeDeadstockSheet(wb, req, hs, ns);
                case "CATEGORY"     -> writeCategorySheet(wb, req, hs, ns);
                default             -> {   // SUMMARY = all sheets
                    writeStatsSheet(wb, req, hs, ns);
                    writeTopProductsSheet(wb, req, hs, ns);
                    writeCategorySheet(wb, req, hs, ns);
                }
            }

            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Product report export failed", e);
            throw new RuntimeException("Không thể xuất báo cáo sản phẩm", e);
        }
    }

    // ── Excel sheet writers ───────────────────────────────────────────────
    private void writeStatsSheet(XSSFWorkbook wb, ProductReportExportRequestDto req,
                                 CellStyle hs, CellStyle ns) {
        LocalDate end   = req.getEndDate()   != null ? req.getEndDate()   : LocalDate.now();
        LocalDate start = req.getStartDate() != null ? req.getStartDate() : resolveStart(req.getPeriod(), end);
        Long storeId = req.getStoreIds() != null && !req.getStoreIds().isEmpty()
                ? req.getStoreIds().get(0) : null;

        List<ProductStatDto> stats = getProductStats(req.getPeriod(), start, end, storeId);
        Sheet sheet = wb.createSheet("Tổng quan");
        Row header = sheet.createRow(0);
        createCell(header, 0, "Chỉ số", hs);
        createCell(header, 1, "Giá trị", hs);
        sheet.setColumnWidth(0, 6000); sheet.setColumnWidth(1, 5000);
        int i = 1;
        for (ProductStatDto s : stats) {
            Row row = sheet.createRow(i++);
            createCell(row, 0, s.getLabel(), null);
            createCell(row, 1, s.getFormattedValue(), null);
        }
    }

    private void writeTopProductsSheet(XSSFWorkbook wb, ProductReportExportRequestDto req,
                                       CellStyle hs, CellStyle ns) {
        LocalDate end   = req.getEndDate()   != null ? req.getEndDate()   : LocalDate.now();
        LocalDate start = req.getStartDate() != null ? req.getStartDate() : resolveStart(req.getPeriod(), end);
        Long storeId = req.getStoreIds() != null && !req.getStoreIds().isEmpty()
                ? req.getStoreIds().get(0) : null;
        Long catId   = req.getCategoryIds() != null && !req.getCategoryIds().isEmpty()
                ? req.getCategoryIds().get(0) : null;

        List<TopProductDto> list = getTopProducts(req.getPeriod(), start, end, storeId, catId, 50);
        Sheet sheet = wb.createSheet("Top Sản phẩm");
        Row header = sheet.createRow(0);
        String[] cols = {"#", "SKU", "Tên sản phẩm", "Đã bán", "Doanh thu (₫)", "Rating", "Reviews"};
        for (int c = 0; c < cols.length; c++) { createCell(header, c, cols[c], hs); sheet.setColumnWidth(c, 4500); }
        int i = 1;
        for (TopProductDto p : list) {
            Row row = sheet.createRow(i++);
            row.createCell(0).setCellValue(p.getRank());
            createCell(row, 1, p.getSku(), null);
            createCell(row, 2, p.getName(), null);
            row.createCell(3).setCellValue(p.getSold());
            Cell rc = row.createCell(4); rc.setCellValue(p.getRevenue().doubleValue()); rc.setCellStyle(ns);
            if (p.getRating() != null) row.createCell(5).setCellValue(p.getRating().doubleValue());
            row.createCell(6).setCellValue(p.getReviews());
        }
    }

    private void writeOverstockSheet(XSSFWorkbook wb, ProductReportExportRequestDto req,
                                     CellStyle hs, CellStyle ns) {
        LocalDate end   = req.getEndDate()   != null ? req.getEndDate()   : LocalDate.now();
        LocalDate start = req.getStartDate() != null ? req.getStartDate() : end.minusMonths(3);
        Long storeId = req.getStoreIds() != null && !req.getStoreIds().isEmpty()
                ? req.getStoreIds().get(0) : null;

        PageDto<OverstockItemDto> page = getOverstockItems(start, end, storeId,
                PageRequest.of(0, 500), 3, 6);
        Sheet sheet = wb.createSheet("Tồn kho cao");
        Row header = sheet.createRow(0);
        String[] cols = {"SKU", "Tên", "Chi nhánh", "Tồn kho", "TB bán/tháng", "Tháng tồn"};
        for (int c = 0; c < cols.length; c++) { createCell(header, c, cols[c], hs); sheet.setColumnWidth(c, 4500); }
        int i = 1;
        for (OverstockItemDto o : page.getContent()) {
            Row row = sheet.createRow(i++);
            createCell(row, 0, o.getSku(), null);
            createCell(row, 1, o.getName(), null);
            createCell(row, 2, o.getStoreName(), null);
            row.createCell(3).setCellValue(o.getTotalStock());
            row.createCell(4).setCellValue(o.getEstMonthlySales().doubleValue());
            if (o.getMonthsOfStock() != null) row.createCell(5).setCellValue(o.getMonthsOfStock().doubleValue());
            else createCell(row, 5, "∞", null);
        }
    }

    private void writeDeadstockSheet(XSSFWorkbook wb, ProductReportExportRequestDto req,
                                     CellStyle hs, CellStyle ns) {
        Long storeId = req.getStoreIds() != null && !req.getStoreIds().isEmpty()
                ? req.getStoreIds().get(0) : null;

        PageDto<DeadStockItemDto> page = getDeadStockItems(28, storeId, PageRequest.of(0, 500));
        Sheet sheet = wb.createSheet("Hàng tồn chết");
        Row header = sheet.createRow(0);
        String[] cols = {"SKU", "Tên", "Chi nhánh", "Tồn kho", "Lần bán cuối", "Giá (₫)"};
        for (int c = 0; c < cols.length; c++) { createCell(header, c, cols[c], hs); sheet.setColumnWidth(c, 5000); }
        DateTimeFormatter dtFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        int i = 1;
        for (DeadStockItemDto d : page.getContent()) {
            Row row = sheet.createRow(i++);
            createCell(row, 0, d.getSku(), null);
            createCell(row, 1, d.getName(), null);
            createCell(row, 2, d.getStoreName(), null);
            row.createCell(3).setCellValue(d.getTotalStock());
            createCell(row, 4, d.getLastSoldAt() != null
                    ? d.getLastSoldAt().format(dtFmt) : "Chưa từng bán", null);
            Cell pc = row.createCell(5); pc.setCellValue(d.getPrice().doubleValue()); pc.setCellStyle(ns);
        }
    }

    private void writeCategorySheet(XSSFWorkbook wb, ProductReportExportRequestDto req,
                                    CellStyle hs, CellStyle ns) {
        LocalDate end   = req.getEndDate()   != null ? req.getEndDate()   : LocalDate.now();
        LocalDate start = req.getStartDate() != null ? req.getStartDate() : resolveStart(req.getPeriod(), end);
        Long storeId = req.getStoreIds() != null && !req.getStoreIds().isEmpty()
                ? req.getStoreIds().get(0) : null;

        List<CategoryBreakdownDto> list = getCategoryBreakdown(start, end, storeId);
        Sheet sheet = wb.createSheet("Danh mục");
        Row header = sheet.createRow(0);
        String[] cols = {"Danh mục", "Doanh thu (₫)", "Đã bán", "Tỷ trọng (%)"};
        for (int c = 0; c < cols.length; c++) { createCell(header, c, cols[c], hs); sheet.setColumnWidth(c, 5000); }
        int i = 1;
        for (CategoryBreakdownDto cat : list) {
            Row row = sheet.createRow(i++);
            createCell(row, 0, cat.getCategoryName(), null);
            Cell rc = row.createCell(1); rc.setCellValue(cat.getRevenue().doubleValue()); rc.setCellStyle(ns);
            row.createCell(2).setCellValue(cat.getUnitsSold());
            row.createCell(3).setCellValue(cat.getSharePercent().doubleValue());
        }
    }

    // ── format helpers ─────────────────────────────────────────────────────
    private String formatVnd(BigDecimal val) {
        if (val == null) return "0 ₫";
        BigDecimal tr = val.divide(BigDecimal.valueOf(1_000_000L), 1, RoundingMode.HALF_UP);
        return tr + " Tr ₫";
    }

    private String formatUnits(Long val) {
        return val != null ? val + " SP" : "0 SP";
    }

    /**
     * "2 tháng trước", "15 ngày trước", "Chưa từng bán"
     */
    private String formatLastSale(LocalDateTime lastSoldAt) {
        if (lastSoldAt == null) return "Chưa từng bán";
        long days = ChronoUnit.DAYS.between(lastSoldAt.toLocalDate(), LocalDate.now());
        if (days < 1)  return "Hôm nay";
        if (days < 7)  return days + " ngày trước";
        if (days < 30) return (days / 7) + " tuần trước";
        if (days < 365) return (days / 30) + " tháng trước";
        return (days / 365) + " năm trước";
    }

    private BigDecimal toBigDecimal(Object raw) {
        if (raw == null) return BigDecimal.ZERO;
        return new BigDecimal(raw.toString());
    }

    // ── POI helpers ────────────────────────────────────────────────────────
    private CellStyle buildHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        return style;
    }

    private CellStyle buildNumberStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        DataFormat fmt = wb.createDataFormat();
        style.setDataFormat(fmt.getFormat("#,##0"));
        return style;
    }

    private void createCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        if (style != null) cell.setCellStyle(style);
    }
}
