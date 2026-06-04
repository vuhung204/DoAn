package com.laptopshop.application.admin.customer.service;

import com.laptopshop.application.admin.customer.dto.*;
import com.laptopshop.application.admin.dashboard.dto.PageDto;
import com.laptopshop.domain.order.entity.Address;
import com.laptopshop.domain.order.repository.AddressRepository;
import com.laptopshop.domain.order.repository.OrderRepository;
import com.laptopshop.domain.user.entity.User;
import com.laptopshop.domain.user.enums.UserStatus;
import com.laptopshop.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
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
public class AdminCustomerServiceImpl implements AdminCustomerService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final AddressRepository addressRepository;
    private final PasswordEncoder   passwordEncoder;

    // ── Ngưỡng VIP: tổng chi tiêu >= 10 triệu VND ────────────────────────
    private static final long VIP_THRESHOLD_VND = 10_000_000L;
    // ── Ngưỡng hot: chi tiêu >= 5 triệu VND trong kỳ ─────────────────────
    private static final long HOT_THRESHOLD_VND = 5_000_000L;

    // ── date helpers ──────────────────────────────────────────────────────
    private LocalDateTime startOf(LocalDate d) { return d.atStartOfDay(); }
    private LocalDateTime endOf(LocalDate d)   { return d.atTime(LocalTime.MAX); }

    private LocalDate resolveStart(String period, LocalDate end) {
        if (period == null) return end.minusDays(29);
        return switch (period.toLowerCase()) {
            case "quarter" -> end.minusDays(89);
            case "week"    -> end.minusDays(6);
            default        -> end.minusDays(29); // month
        };
    }

    // ── map UserStatus enum → UI string ───────────────────────────────────
    private String statusToUi(UserStatus s) {
        if (s == null) return "active";
        return switch (s) {
            case LOCKED     -> "locked";
            case UNVERIFIED -> "unverified";
            default         -> "active";
        };
    }

    // ── map UI string → UserStatus enum ───────────────────────────────────
    private UserStatus uiToStatus(String s) {
        if (s == null) return null;
        return switch (s.toLowerCase()) {
            case "locked"     -> UserStatus.LOCKED;
            case "unverified" -> UserStatus.UNVERIFIED;
            default           -> UserStatus.ACTIVE;
        };
    }

    // ── classify customer type ────────────────────────────────────────────
    private String classifyType(BigDecimal totalSpent, LocalDate joined) {
        boolean isNew = joined != null
                && joined.isAfter(LocalDate.now().minusDays(30));
        if (isNew) return "new";
        if (totalSpent != null
                && totalSpent.compareTo(BigDecimal.valueOf(VIP_THRESHOLD_VND)) >= 0)
            return "vip";
        return "regular";
    }

    // ══════════════════════════════════════════════════════════════════════
    // 1. getStats
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public CustomerStatsSummaryDto getStats(String period, LocalDate endDate, Long storeId) {
        LocalDate end   = endDate != null ? endDate : LocalDate.now();
        LocalDate start = resolveStart(period, end);

        long total   = userRepository.count();
        long newCust = userRepository.countNewUsersBetween(startOf(start), endOf(end));
        long hot     = userRepository.countHotCustomers(
                startOf(start), endOf(end), storeId, HOT_THRESHOLD_VND);
        long locked  = userRepository.countByStatus(UserStatus.LOCKED);

        return new CustomerStatsSummaryDto(
                total, newCust, hot, locked,
                String.valueOf(total),
                "+" + newCust
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. searchCustomers
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public PageDto<CustomerListDto> searchCustomers(String q, String status, String type,
                                                    Pageable pageable, Long storeId) {
        String qParam      = (q != null && !q.isBlank()) ? q.trim() : null;
        UserStatus statusEnum = uiToStatus(status);

        Page<User> userPage = userRepository.searchCustomers(qParam, statusEnum, pageable);

        // Lấy order stats cho page hiện tại
        List<Long> userIds = userPage.getContent().stream()
                .map(User::getId).collect(Collectors.toList());

        Map<Long, long[]> statsMap = new HashMap<>(); // [orderCount, totalSpent]
        if (!userIds.isEmpty()) {
            userRepository.findOrderStatsByUserIds(userIds).forEach(r -> {
                Long uid   = ((Number) r[0]).longValue();
                long cnt   = ((Number) r[1]).longValue();
                long spent = ((Number) r[2]).longValue();
                statsMap.put(uid, new long[]{cnt, spent});
            });
        }

        List<CustomerListDto> content = userPage.getContent().stream().map(u -> {
                    long[] stats   = statsMap.getOrDefault(u.getId(), new long[]{0L, 0L});
                    BigDecimal spent = BigDecimal.valueOf(stats[1]);
                    LocalDate joined = u.getCreatedAt() != null
                            ? u.getCreatedAt().toLocalDate() : null;
                    String ctype   = classifyType(spent, joined);

                    return new CustomerListDto(
                            u.getId(),
                            u.getFullName(),
                            u.getEmail(),
                            u.getPhone(),
                            (int) stats[0],
                            spent,
                            ctype,
                            statusToUi(u.getStatus()),
                            joined
                    );
                })
                .filter(dto -> type == null || type.equalsIgnoreCase(dto.getType()))
                .collect(Collectors.toList());

        Page<CustomerListDto> mapped = new PageImpl<>(content, pageable, userPage.getTotalElements());
        return PageDto.from(mapped);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 3. getTopCustomers
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public List<TopCustomerDto> getTopCustomers(LocalDate startDate, LocalDate endDate,
                                                int limit, Long storeId) {
        LocalDate end   = endDate   != null ? endDate   : LocalDate.now();
        LocalDate start = startDate != null ? startDate : end.minusDays(29);

        List<Object[]> rows = userRepository.findTopCustomersByRevenue(
                startOf(start), endOf(end), storeId, limit);

        return rows.stream().map(r -> {
            Long      uid     = ((Number) r[0]).longValue();
            String    name    = (String)  r[1];
            String    email   = (String)  r[2];
            BigDecimal rev    = new BigDecimal(r[3].toString());
            int       orders  = ((Number) r[4]).intValue();
            BigDecimal aov    = orders > 0
                    ? rev.divide(BigDecimal.valueOf(orders), 0, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            return new TopCustomerDto(uid, name, email, rev, orders, aov);
        }).collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════════════
    // 4. getCustomerDetail
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public CustomerDetailDto getCustomerDetail(Long id) {
        User user = userRepository.findByIdWithAddresses(id)
                .orElseThrow(() -> new NoSuchElementException("Khách hàng không tồn tại: " + id));

        BigDecimal totalSpent   = orderRepository.sumTotalSpentByUser(id);
        long       totalOrders  = orderRepository.countValidOrdersByUser(id);
        BigDecimal avgPerOrder  = totalOrders > 0
                ? totalSpent.divide(BigDecimal.valueOf(totalOrders), 0, RoundingMode.HALF_UP)
                : null;

        LocalDate joined = user.getCreatedAt() != null
                ? user.getCreatedAt().toLocalDate() : null;
        String ctype = classifyType(totalSpent, joined);

        // Addresses
        List<AddressDto> addressDtos = user.getAddresses() == null
                ? List.of()
                : user.getAddresses().stream()
                .map(this::toAddressDto)
                .collect(Collectors.toList());

        // Primary address
        String primary = addressDtos.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                .map(AddressDto::getText)
                .findFirst()
                .orElse(addressDtos.isEmpty() ? null : addressDtos.get(0).getText());

        // Orders preview (page 0, size 5)
        PageDto<OrderSummaryDto> ordersPreview = getCustomerOrders(id, PageRequest.of(0, 5));

        return new CustomerDetailDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                primary,
                statusToUi(user.getStatus()),
                ctype,
                (int) totalOrders,
                totalSpent,
                avgPerOrder,
                joined,
                addressDtos,
                ordersPreview
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // 5. getCustomerOrders
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public PageDto<OrderSummaryDto> getCustomerOrders(Long customerId, Pageable pageable) {
        Page<Object[]> page = orderRepository.findOrderSummariesByUserId(customerId, pageable);

        List<OrderSummaryDto> content = page.getContent().stream().map(r -> {
            String      code    = (String)  r[0];
            BigDecimal  amount  = new BigDecimal(r[1].toString());
            String      method  = r[2] != null ? r[2].toString() : null;
            String      status  = (String)  r[3];
            LocalDateTime at    = r[4] instanceof java.sql.Timestamp ts
                    ? ts.toLocalDateTime()
                    : LocalDateTime.parse(r[4].toString());
            return new OrderSummaryDto(code, amount, method, status, at);
        }).collect(Collectors.toList());

        return PageDto.from(new PageImpl<>(content, pageable, page.getTotalElements()));
    }

    // ══════════════════════════════════════════════════════════════════════
    // 6. updateCustomerStatus
    // ══════════════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public void updateCustomerStatus(Long id, UpdateCustomerStatusRequestDto req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khách hàng không tồn tại: " + id));
        user.setStatus(uiToStatus(req.getStatus()));
        userRepository.save(user);
        log.info("Customer {} status updated to {} by staff. Note: {}",
                id, req.getStatus(), req.getStaffNote());
    }

    // ══════════════════════════════════════════════════════════════════════
    // 7. resetPassword
    // ══════════════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public ResetPasswordResponseDto resetPassword(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khách hàng không tồn tại: " + id));

        // Tạo temp password 10 ký tự
        String tempPassword = generateTempPassword();
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        userRepository.save(user);

        // TODO: gọi EmailService.sendResetPasswordEmail(user.getEmail(), tempPassword)
        log.info("Password reset for customer {} ({})", id, user.getEmail());

        // Production: trả emailSent=true, tempPassword=null
        return new ResetPasswordResponseDto(true, null);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 8. exportCustomers — Apache POI
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public byte[] exportCustomers(CustomerExportRequestDto req) {
        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle hs = buildHeaderStyle(wb);
            CellStyle ns = buildNumberStyle(wb);

            switch (req.getType().toUpperCase()) {
                case "SUMMARY" -> writeSummarySheet(wb, req, hs, ns);
                case "DETAILS" -> {
                    writeListSheet(wb, req, hs, ns);
                    // TODO: chi tiết từng khách nếu cần
                }
                default -> writeListSheet(wb, req, hs, ns);
            }

            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Customer export failed", e);
            throw new RuntimeException("Không thể xuất báo cáo khách hàng", e);
        }
    }

    // ── Excel: Summary sheet ──────────────────────────────────────────────
    private void writeSummarySheet(XSSFWorkbook wb, CustomerExportRequestDto req,
                                   CellStyle hs, CellStyle ns) {
        CustomerStatsSummaryDto stats = getStats("month", null, req.getStoreId());
        Sheet sheet = wb.createSheet("Tổng quan");

        Row header = sheet.createRow(0);
        createCell(header, 0, "Chỉ số", hs);
        createCell(header, 1, "Giá trị", hs);
        sheet.setColumnWidth(0, 6000); sheet.setColumnWidth(1, 4000);

        String[][] rows = {
                {"Tổng khách hàng",   String.valueOf(stats.getTotalCustomers())},
                {"Khách hàng mới",    String.valueOf(stats.getNewCustomers())},
                {"Khách hàng hot",    String.valueOf(stats.getHotCustomers())},
                {"Tài khoản bị khoá", String.valueOf(stats.getLockedAccounts())}
        };
        for (int i = 0; i < rows.length; i++) {
            Row row = sheet.createRow(i + 1);
            createCell(row, 0, rows[i][0], null);
            createCell(row, 1, rows[i][1], null);
        }
    }

    // ── Excel: List sheet ─────────────────────────────────────────────────
    private void writeListSheet(XSSFWorkbook wb, CustomerExportRequestDto req,
                                CellStyle hs, CellStyle ns) {
        List<Object[]> rows = orderRepository.findCustomerAggregatesForExport(
                req.getSearch(), req.getStatus() != null ? req.getStatus().toUpperCase() : null);

        Sheet sheet = wb.createSheet("Danh sách khách hàng");
        Row header = sheet.createRow(0);
        String[] cols = {"ID", "Họ tên", "Email", "Điện thoại",
                "Trạng thái", "Ngày tham gia", "Tổng đơn", "Tổng chi tiêu (₫)"};
        for (int c = 0; c < cols.length; c++) {
            createCell(header, c, cols[c], hs);
            sheet.setColumnWidth(c, 5000);
        }
        sheet.setColumnWidth(1, 6000);
        sheet.setColumnWidth(2, 7000);

        DateTimeFormatter dtFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        int rowIdx = 1;
        for (Object[] r : rows) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(((Number) r[0]).longValue());
            createCell(row, 1, (String) r[1], null);
            createCell(row, 2, (String) r[2], null);
            createCell(row, 3, r[3] != null ? (String) r[3] : "", null);
            createCell(row, 4, r[4] != null ? r[4].toString() : "", null);
            String joined = "";
            if (r[5] instanceof java.sql.Timestamp ts)
                joined = ts.toLocalDateTime().format(dtFmt);
            createCell(row, 5, joined, null);
            row.createCell(6).setCellValue(((Number) r[6]).longValue());
            Cell sc = row.createCell(7);
            sc.setCellValue(((Number) r[7]).doubleValue());
            sc.setCellStyle(ns);
        }
    }

    // ── Address helper ────────────────────────────────────────────────────
    private AddressDto toAddressDto(Address a) {
        String label = a.getRecipientName() + " · " + a.getPhone();
        StringBuilder sb = new StringBuilder(a.getAddressLine());
        if (a.getWard()     != null) sb.append(", ").append(a.getWard());
        if (a.getDistrict() != null) sb.append(", ").append(a.getDistrict());
        if (a.getCity()     != null) sb.append(", ").append(a.getCity());
        return new AddressDto(a.getId(), label, sb.toString(), a.getIsDefault());
    }

    // ── Temp password generator ───────────────────────────────────────────
    private String generateTempPassword() {
        String chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        Random rnd = new Random();
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++)
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        return sb.toString();
    }

    // ── POI helpers ───────────────────────────────────────────────────────
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
