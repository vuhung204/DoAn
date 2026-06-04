package com.laptopshop.application.admin.revenue.service;

import com.laptopshop.application.admin.revenue.dto.*;
import com.laptopshop.domain.order.repository.OrderRepository;
import com.laptopshop.domain.store.entity.Store;
import com.laptopshop.domain.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
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
public class RevenueServiceImpl implements RevenueService {

    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;

    // ── date helpers ───────────────────────────────────────────────────────
    private LocalDateTime startOf(LocalDate d) { return d.atStartOfDay(); }
    private LocalDateTime endOf(LocalDate d)   { return d.atTime(LocalTime.MAX); }

    // ── storeKey từ store name (lấy 2–3 ký tự đầu viết thường) ────────────
    private String toStoreKey(String storeName) {
        if (storeName == null || storeName.isBlank()) return "unknown";
        return storeName.trim()
                .toLowerCase()
                .replaceAll("\\s+", "_")
                .replaceAll("[^a-z0-9_]", "")
                .substring(0, Math.min(storeName.length(), 8));
    }

    /** Map storeId → Store (lazy-loaded once per call) */
    private Map<Long, Store> storeMap() {
        return storeRepository.findAllActive()
                .stream()
                .collect(Collectors.toMap(Store::getId, s -> s));
    }

    // ══════════════════════════════════════════════════════════════════════
    // 1. getSummary
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public RevenueSummaryDto getSummary(String mode, LocalDate startDate, LocalDate endDate,
                                        List<Long> branchIds) {
        LocalDate start = startDate != null ? startDate : defaultStart(mode);
        LocalDate end   = endDate   != null ? endDate   : LocalDate.now();

        List<RevenueKpiDto>       kpis       = buildKpis(mode, start, end, branchIds);
        List<RevenueSeriesPointDto> series   = getSeries(mode, start, end, branchIds);
        List<BranchRevenueDto>    topBranches = getBranchRevenues(start, end, 5);

        // Snapshot so sánh: kỳ trước tương đương độ dài kỳ hiện tại
        long days     = end.toEpochDay() - start.toEpochDay() + 1;
        LocalDate prevEnd   = start.minusDays(1);
        LocalDate prevStart = prevEnd.minusDays(days - 1);
        List<BranchComparisonDto> snapshot =
                compareBranches(mode, start, end, prevStart, prevEnd, "revenue", 5);

        return new RevenueSummaryDto(kpis, series, topBranches, snapshot);
    }

    // ── KPI cards ──────────────────────────────────────────────────────────
    private List<RevenueKpiDto> buildKpis(String mode, LocalDate start, LocalDate end,
                                          List<Long> branchIds) {
        LocalDateTime lStart = startOf(start);
        LocalDateTime lEnd   = endOf(end);

        // Kỳ hiện tại
        Long storeId = (branchIds != null && branchIds.size() == 1) ? branchIds.get(0) : null;
        BigDecimal totalRev  = orderRepository.sumValidRevenue(lStart, lEnd, storeId);
        long       orderCount = orderRepository.countValidOrders(lStart, lEnd, storeId);

        // Kỳ trước (để tính growth)
        long days = end.toEpochDay() - start.toEpochDay() + 1;
        LocalDate prevEnd   = start.minusDays(1);
        LocalDate prevStart = prevEnd.minusDays(days - 1);
        BigDecimal prevRev  = orderRepository.sumValidRevenue(startOf(prevStart), endOf(prevEnd), storeId);

        String revenueGrowth = calcGrowth(totalRev, prevRev);

        BigDecimal avgDaily = days > 0
                ? totalRev.divide(BigDecimal.valueOf(days), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal aov = orderCount > 0
                ? totalRev.divide(BigDecimal.valueOf(orderCount), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return List.of(
                new RevenueKpiDto("Tổng doanh thu",   formatVnd(totalRev, mode),  totalRev,  revenueGrowth),
                new RevenueKpiDto("Doanh thu TB/ngày", formatVnd(avgDaily, mode), avgDaily,  ""),
                new RevenueKpiDto("Tổng đơn hàng",    String.valueOf(orderCount), BigDecimal.valueOf(orderCount), ""),
                new RevenueKpiDto("Giá trị đơn TB",   formatVnd(aov, mode),       aov,       "")
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. getSeries
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public List<RevenueSeriesPointDto> getSeries(String mode, LocalDate startDate,
                                                 LocalDate endDate, List<Long> branchIds) {
        LocalDateTime start = startOf(startDate);
        LocalDateTime end   = endOf(endDate);
        List<Long> ids = (branchIds != null && !branchIds.isEmpty()) ? branchIds : null;

        List<Object[]> rows = switch (mode.toLowerCase()) {
            case "month" -> orderRepository.findRevenueRowsByMonth(start, end, ids);
            case "year"  -> orderRepository.findRevenueRowsByYear(start, end, ids);
            default      -> orderRepository.findRevenueRowsByDay(start, end, ids);
        };

        Map<Long, Store> stores = storeMap();

        return rows.stream().map(r -> {
            String    label   = buildLabel(r[0], mode);
            Long      stId    = r[1] != null ? ((Number) r[1]).longValue() : null;
            String    key     = stId != null && stores.containsKey(stId)
                    ? toStoreKey(stores.get(stId).getName())
                    : null;
            BigDecimal rev    = r[2] != null ? new BigDecimal(r[2].toString()) : BigDecimal.ZERO;
            return new RevenueSeriesPointDto(label, stId, key, rev);
        }).collect(Collectors.toList());
    }

    // ── label builder theo mode ────────────────────────────────────────────
    private String buildLabel(Object raw, String mode) {
        if (raw == null) return "";
        return switch (mode.toLowerCase()) {
            case "month" -> {
                String[] parts = raw.toString().split("-");
                yield "T" + Integer.parseInt(parts[1]) + "/" + parts[0];
            }
            case "year" -> raw.toString();
            default -> {
                LocalDate d = (raw instanceof java.sql.Date jsd)
                        ? jsd.toLocalDate()
                        : LocalDate.parse(raw.toString());
                yield d.format(DateTimeFormatter.ofPattern("dd/MM"));
            }
        };
    }

    // ══════════════════════════════════════════════════════════════════════
    // 3. getBranchRevenues
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public List<BranchRevenueDto> getBranchRevenues(LocalDate startDate, LocalDate endDate,
                                                    Integer limit) {
        int top = (limit != null && limit > 0) ? limit : Integer.MAX_VALUE;
        List<Object[]> rows = orderRepository.findBranchRevenueSum(
                startOf(startDate), endOf(endDate), top);

        return rows.stream().map(r -> {
            Long      sId  = ((Number) r[0]).longValue();
            String    name = (String) r[1];
            BigDecimal rev = r[2] != null ? new BigDecimal(r[2].toString()) : BigDecimal.ZERO;
            return new BranchRevenueDto(sId, toStoreKey(name), name, rev);
        }).collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════════════
    // 4. compareBranches
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public List<BranchComparisonDto> compareBranches(String mode,
                                                     LocalDate curStart,  LocalDate curEnd,
                                                     LocalDate prevStart, LocalDate prevEnd,
                                                     String sortBy, Integer limit) {
        List<Object[]> rows = orderRepository.findBranchRevenueForTwoPeriods(
                startOf(curStart), endOf(curEnd),
                startOf(prevStart), endOf(prevEnd));

        // Tổng cur revenue (để tính sharePercent)
        BigDecimal totalCur = rows.stream()
                .map(r -> r[2] != null ? new BigDecimal(r[2].toString()) : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<BranchComparisonDto> list = rows.stream().map(r -> {
            Long      sId      = ((Number) r[0]).longValue();
            String    name     = (String)  r[1];
            BigDecimal cur     = r[2] != null ? new BigDecimal(r[2].toString()) : BigDecimal.ZERO;
            BigDecimal prev    = r[3] != null ? new BigDecimal(r[3].toString()) : BigDecimal.ZERO;
            BigDecimal growth  = calcGrowthDecimal(cur, prev);
            BigDecimal share   = totalCur.compareTo(BigDecimal.ZERO) > 0
                    ? cur.multiply(BigDecimal.valueOf(100))
                    .divide(totalCur, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            return new BranchComparisonDto(sId, toStoreKey(name), name, cur, prev, growth, share);
        }).collect(Collectors.toList());

        // Sort
        Comparator<BranchComparisonDto> cmp = switch (
                sortBy != null ? sortBy.toLowerCase() : "revenue") {
            case "growth" -> Comparator.comparing(
                    d -> d.getGrowthPercent() != null ? d.getGrowthPercent() : BigDecimal.valueOf(Long.MIN_VALUE),
                    Comparator.reverseOrder());
            case "share"  -> Comparator.comparing(BranchComparisonDto::getSharePercent,
                    Comparator.reverseOrder());
            default       -> Comparator.comparing(BranchComparisonDto::getCurRevenue,
                    Comparator.reverseOrder());
        };
        list.sort(cmp);

        return (limit != null && limit > 0 && limit < list.size())
                ? list.subList(0, limit)
                : list;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 5. getYearlyRevenue
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public List<YearlyRevenueDto> getYearlyRevenue(int startYear, int endYear) {
        List<Object[]> rows = orderRepository.findYearlyRevenue(startYear, endYear);
        return rows.stream().map(r -> {
            int        year = ((Number) r[0]).intValue();
            BigDecimal rev  = r[1] != null ? new BigDecimal(r[1].toString()) : BigDecimal.ZERO;
            return new YearlyRevenueDto(year, rev, null);
        }).collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════════════
    // 6. exportRevenue — Apache POI
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public byte[] exportRevenue(RevenueExportRequestDto req) {
        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle headerStyle = buildHeaderStyle(wb);
            CellStyle numberStyle = buildNumberStyle(wb);

            switch (req.getType().toUpperCase()) {
                case "SERIES"   -> writeSeriesSheet(wb, req, headerStyle, numberStyle);
                case "BRANCHES" -> writeBranchesSheet(wb, req, headerStyle, numberStyle);
                case "DETAILS"  -> {
                    writeSummarySheet(wb, req, headerStyle, numberStyle);
                    writeSeriesSheet(wb, req, headerStyle, numberStyle);
                    writeBranchesSheet(wb, req, headerStyle, numberStyle);
                }
                default         -> writeSummarySheet(wb, req, headerStyle, numberStyle);
            }

            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Revenue export failed", e);
            throw new RuntimeException("Không thể xuất báo cáo doanh thu", e);
        }
    }

    // ── Excel sheet writers ────────────────────────────────────────────────
    private void writeSummarySheet(XSSFWorkbook wb, RevenueExportRequestDto req,
                                   CellStyle hs, CellStyle ns) {
        List<RevenueKpiDto> kpis = buildKpis(req.getMode(),
                req.getStartDate(), req.getEndDate(), req.getBranchIds());
        Sheet sheet = wb.createSheet("Summary");
        Row header = sheet.createRow(0);
        createCell(header, 0, "Chỉ số", hs);
        createCell(header, 1, "Giá trị (₫)", hs);
        createCell(header, 2, "Định dạng", hs);
        createCell(header, 3, "Tăng trưởng", hs);
        sheet.setColumnWidth(0, 6000); sheet.setColumnWidth(1, 7000);
        sheet.setColumnWidth(2, 4000); sheet.setColumnWidth(3, 3000);
        int i = 1;
        for (RevenueKpiDto k : kpis) {
            Row row = sheet.createRow(i++);
            createCell(row, 0, k.getLabel(), null);
            Cell vc = row.createCell(1);
            vc.setCellValue(k.getValue().doubleValue());
            vc.setCellStyle(ns);
            createCell(row, 2, k.getFormattedValue(), null);
            createCell(row, 3, k.getGrowth(), null);
        }
    }

    private void writeSeriesSheet(XSSFWorkbook wb, RevenueExportRequestDto req,
                                  CellStyle hs, CellStyle ns) {
        List<RevenueSeriesPointDto> series = getSeries(
                req.getMode(), req.getStartDate(), req.getEndDate(), req.getBranchIds());
        Sheet sheet = wb.createSheet("Series");
        Row header = sheet.createRow(0);
        createCell(header, 0, "Thời gian", hs);
        createCell(header, 1, "Chi nhánh", hs);
        createCell(header, 2, "Doanh thu (₫)", hs);
        sheet.setColumnWidth(0, 4000); sheet.setColumnWidth(1, 5000); sheet.setColumnWidth(2, 7000);
        int i = 1;
        for (RevenueSeriesPointDto p : series) {
            Row row = sheet.createRow(i++);
            createCell(row, 0, p.getLabel(), null);
            createCell(row, 1, p.getStoreKey() != null ? p.getStoreKey() : "all", null);
            Cell rc = row.createCell(2);
            rc.setCellValue(p.getRevenue().doubleValue());
            rc.setCellStyle(ns);
        }
    }

    private void writeBranchesSheet(XSSFWorkbook wb, RevenueExportRequestDto req,
                                    CellStyle hs, CellStyle ns) {
        List<BranchRevenueDto> branches = getBranchRevenues(
                req.getStartDate(), req.getEndDate(), null);
        Sheet sheet = wb.createSheet("Branches");
        Row header = sheet.createRow(0);
        createCell(header, 0, "Chi nhánh", hs);
        createCell(header, 1, "Doanh thu (₫)", hs);
        sheet.setColumnWidth(0, 6000); sheet.setColumnWidth(1, 7000);
        int i = 1;
        for (BranchRevenueDto b : branches) {
            Row row = sheet.createRow(i++);
            createCell(row, 0, b.getStoreName(), null);
            Cell rc = row.createCell(1);
            rc.setCellValue(b.getRevenue().doubleValue());
            rc.setCellStyle(ns);
        }
    }

    // ── helpers ────────────────────────────────────────────────────────────
    private String calcGrowth(BigDecimal cur, BigDecimal prev) {
        BigDecimal g = calcGrowthDecimal(cur, prev);
        if (g == null) return "N/A";
        String sign = g.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "";
        return sign + g.setScale(1, RoundingMode.HALF_UP) + "%";
    }

    private BigDecimal calcGrowthDecimal(BigDecimal cur, BigDecimal prev) {
        if (prev == null || prev.compareTo(BigDecimal.ZERO) == 0) return null;
        return cur.subtract(prev)
                .multiply(BigDecimal.valueOf(100))
                .divide(prev, 2, RoundingMode.HALF_UP);
    }

    private String formatVnd(BigDecimal val, String mode) {
        if (val == null) return "0 ₫";
        return switch (mode.toLowerCase()) {
            case "year", "month" -> {
                // Tỷ đồng
                BigDecimal ty = val.divide(BigDecimal.valueOf(1_000_000_000L), 1, RoundingMode.HALF_UP);
                yield ty + " T đ";
            }
            default -> {
                // Triệu đồng
                BigDecimal tr = val.divide(BigDecimal.valueOf(1_000_000L), 1, RoundingMode.HALF_UP);
                yield tr + " Tr đ";
            }
        };
    }

    private LocalDate defaultStart(String mode) {
        return switch (mode.toLowerCase()) {
            case "year"  -> LocalDate.of(LocalDate.now().getYear() - 4, 1, 1);
            case "month" -> LocalDate.now().withDayOfMonth(1).minusMonths(11);
            default      -> LocalDate.now().minusDays(29);
        };
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