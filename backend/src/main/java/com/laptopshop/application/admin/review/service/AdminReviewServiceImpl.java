package com.laptopshop.application.admin.review.service;

import com.laptopshop.application.admin.dashboard.dto.PageDto;
import com.laptopshop.application.admin.review.dto.*;
import com.laptopshop.domain.review.entity.Review;
import com.laptopshop.domain.review.enums.ReviewStatus;
import com.laptopshop.domain.review.repository.ReviewRepository;
import com.laptopshop.domain.store.entity.Staff;
import com.laptopshop.domain.store.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
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
public class AdminReviewServiceImpl implements AdminReviewService {

    private final ReviewRepository reviewRepository;
    private final StaffRepository  staffRepository;

    // ── date helpers ──────────────────────────────────────────────────────
    private LocalDateTime startOf(LocalDate d) { return d.atStartOfDay(); }
    private LocalDateTime endOf(LocalDate d)   { return d.atTime(LocalTime.MAX); }

    private LocalDate orDefault30(LocalDate d) {
        return d != null ? d : LocalDate.now().minusDays(29);
    }

    // ── map Object[] row → ReviewListDto ─────────────────────────────────
    private ReviewListDto toListDto(Object[] r) {
        Long      id          = ((Number) r[0]).longValue();
        Long      productId   = ((Number) r[1]).longValue();
        String    productName = (String)  r[2];
        Long      userId      = r[3] != null ? ((Number) r[3]).longValue() : null;
        String    custName    = (String)  r[4];
        String    email       = (String)  r[5];
        Integer   rating      = ((Number) r[6]).intValue();
        String    title       = (String)  r[7];
        String    shortText   = (String)  r[8];
        Integer   imgCount    = ((Number) r[9]).intValue();
        LocalDateTime createdAt = toLocalDateTime(r[10]);
        String    status      = (String)  r[11];
        return new ReviewListDto(id, productId, productName,
                userId, custName, email, rating, title,
                shortText, imgCount, createdAt, status);
    }

    // ── LocalDateTime cast helper ─────────────────────────────────────────
    private LocalDateTime toLocalDateTime(Object raw) {
        if (raw == null) return null;
        if (raw instanceof java.sql.Timestamp ts) return ts.toLocalDateTime();
        return LocalDateTime.parse(raw.toString());
    }

    // ══════════════════════════════════════════════════════════════════════
    // 1. searchReviews
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public PageDto<ReviewListDto> searchReviews(String q, String status, Integer rating,
                                                LocalDate startDate, LocalDate endDate,
                                                Pageable pageable) {
        String qParam  = (q != null && !q.isBlank()) ? q.trim() : null;
        String stParam = (status != null && !status.isBlank()) ? status.toUpperCase() : null;

        LocalDateTime start = startDate != null ? startOf(startDate) : null;
        LocalDateTime end   = endDate   != null ? endOf(endDate)     : null;

        Page<Object[]> page = reviewRepository.searchReviews(
                qParam, stParam, rating, start, end, pageable);

        List<ReviewListDto> content = page.getContent().stream()
                .map(this::toListDto)
                .collect(Collectors.toList());

        return PageDto.from(new PageImpl<>(content, pageable, page.getTotalElements()));
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. getReview
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public ReviewDetailDto getReview(Long id) {
        Review r = reviewRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new NoSuchElementException("Review không tồn tại: " + id));
        return toDetailDto(r);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 3. updateReview
    // ══════════════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public ReviewDetailDto updateReview(Long id, ReviewUpdateRequestDto dto) {
        Review r = reviewRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Review không tồn tại: " + id));
        if (dto.getTitle()  != null) r.setTitle(dto.getTitle());
        if (dto.getText()   != null) r.setText(dto.getText());
        if (dto.getRating() != null) r.setRating(dto.getRating());
        reviewRepository.save(r);
        return toDetailDto(r);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 4. updateStatus
    // ══════════════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public void updateStatus(Long id, String status, String updatedBy) {
        ReviewStatus newStatus = ReviewStatus.fromString(status);
        int updated = reviewRepository.updateStatus(id, newStatus, LocalDateTime.now());
        if (updated == 0)
            throw new NoSuchElementException("Review không tồn tại: " + id);
        log.info("Review {} status → {} by {}", id, newStatus, updatedBy);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 5. replyReview
    // ══════════════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public void replyReview(Long id, ReviewReplyRequestDto dto, String repliedBy) {
        // Resolve staff từ email/username (principal)
        Staff staff = staffRepository.findByEmail(repliedBy)
                .orElseThrow(() -> new NoSuchElementException(
                        "Staff không tồn tại: " + repliedBy));

        int updated = reviewRepository.saveReply(
                id, dto.getReplyText(), staff, LocalDateTime.now());
        if (updated == 0)
            throw new NoSuchElementException("Review không tồn tại: " + id);

        log.info("Review {} replied by {}", id, repliedBy);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 6. deleteReview
    // ══════════════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public void deleteReview(Long id) {
        if (!reviewRepository.existsById(id))
            throw new NoSuchElementException("Review không tồn tại: " + id);
        reviewRepository.deleteById(id);
        log.info("Review {} deleted", id);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 7. getStats
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public List<ReviewStatsDto> getStats(LocalDate startDate, LocalDate endDate) {
        LocalDate start = orDefault30(startDate);
        LocalDate end   = endDate != null ? endDate : LocalDate.now();

        LocalDateTime lStart = startOf(start);
        LocalDateTime lEnd   = endOf(end);

        // Status counts
        Map<String, Long> statusMap = new HashMap<>();
        reviewRepository.countByStatus(lStart, lEnd).forEach(r ->
                statusMap.put((String) r[0], ((Number) r[1]).longValue()));

        long total    = statusMap.values().stream().mapToLong(Long::longValue).sum();
        long approved = statusMap.getOrDefault("APPROVED", 0L);
        long pending  = statusMap.getOrDefault("PENDING",  0L);
        long hidden   = statusMap.getOrDefault("HIDDEN",   0L);

        // Rating distribution
        List<Object[]> ratingRows = reviewRepository.countByRating(lStart, lEnd);
        long[] ratingCounts = new long[6]; // index 1–5
        for (Object[] r : ratingRows) {
            int    rt  = ((Number) r[0]).intValue();
            long   cnt = ((Number) r[1]).longValue();
            if (rt >= 1 && rt <= 5) ratingCounts[rt] = cnt;
        }
        List<ReviewStatsDto.RatingDistributionDto> distribution = new ArrayList<>();
        for (int i = 5; i >= 1; i--) {
            double pct = total > 0 ? Math.round(ratingCounts[i] * 1000.0 / total) / 10.0 : 0.0;
            distribution.add(new ReviewStatsDto.RatingDistributionDto(i, ratingCounts[i], pct));
        }

        // Build stat cards — align với frontend ReviewStats mock
        return List.of(
                new ReviewStatsDto("Tổng review",    String.valueOf(total),    "rate_review", "icon-total",    distribution),
                new ReviewStatsDto("Đã duyệt",       String.valueOf(approved), "check_circle","icon-approved", null),
                new ReviewStatsDto("Chờ duyệt",      String.valueOf(pending),  "pending",     "icon-pending",  null),
                new ReviewStatsDto("Đã ẩn",          String.valueOf(hidden),   "visibility_off","icon-hidden", null)
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // 8. exportReviews — Apache POI (XLSX) hoặc CSV
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public byte[] exportReviews(ExportReviewsRequestDto req) {
        LocalDateTime start = req.getStartDate() != null ? startOf(req.getStartDate()) : null;
        LocalDateTime end   = req.getEndDate()   != null ? endOf(req.getEndDate())     : null;
        String status = req.getStatus() != null && !req.getStatus().isBlank()
                ? req.getStatus().toUpperCase() : null;

        List<Object[]> rows = reviewRepository.findForExport(status, req.getRating(), start, end);

        if ("CSV".equalsIgnoreCase(req.getFormat())) {
            return exportAsCsv(rows);
        }
        return exportAsXlsx(rows);
    }

    // ── XLSX export ───────────────────────────────────────────────────────
    private byte[] exportAsXlsx(List<Object[]> rows) {
        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.createSheet("Reviews");
            CellStyle hs = buildHeaderStyle(wb);
            CellStyle ns = buildNumberStyle(wb);

            String[] cols = {"ID", "Sản phẩm", "Khách hàng", "Email",
                    "Rating", "Tiêu đề", "Nội dung", "Ảnh",
                    "Trạng thái", "Ngày tạo", "Reply", "Ngày reply"};
            Row header = sheet.createRow(0);
            for (int c = 0; c < cols.length; c++) {
                createCell(header, c, cols[c], hs);
                sheet.setColumnWidth(c, c == 6 ? 10000 : 5000);
            }

            DateTimeFormatter dtFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            int rowIdx = 1;
            for (Object[] r : rows) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(((Number) r[0]).longValue());
                createCell(row, 1,  (String) r[1],  null);
                createCell(row, 2,  (String) r[2],  null);
                createCell(row, 3,  (String) r[3],  null);
                row.createCell(4).setCellValue(((Number) r[4]).intValue());
                createCell(row, 5,  r[5] != null ? (String) r[5] : "", null);
                createCell(row, 6,  r[6] != null ? (String) r[6] : "", null);
                row.createCell(7).setCellValue(((Number) r[7]).intValue());
                createCell(row, 8,  (String) r[8],  null);
                createCell(row, 9,  toLocalDateTime(r[9]) != null
                        ? toLocalDateTime(r[9]).format(dtFmt) : "", null);
                createCell(row, 10, r[10] != null ? (String) r[10] : "", null);
                createCell(row, 11, toLocalDateTime(r[11]) != null
                        ? toLocalDateTime(r[11]).format(dtFmt) : "", null);
            }

            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Review XLSX export failed", e);
            throw new RuntimeException("Không thể xuất file XLSX", e);
        }
    }

    // ── CSV export ────────────────────────────────────────────────────────
    private byte[] exportAsCsv(List<Object[]> rows) {
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Sản phẩm,Khách hàng,Email,Rating,Tiêu đề,Nội dung,Ảnh,Trạng thái,Ngày tạo,Reply,Ngày reply\n");
        DateTimeFormatter dtFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        for (Object[] r : rows) {
            sb.append(((Number) r[0]).longValue()).append(',');
            sb.append(csvEsc(r[1])).append(',');
            sb.append(csvEsc(r[2])).append(',');
            sb.append(csvEsc(r[3])).append(',');
            sb.append(r[4]).append(',');
            sb.append(csvEsc(r[5])).append(',');
            sb.append(csvEsc(r[6])).append(',');
            sb.append(r[7]).append(',');
            sb.append(r[8]).append(',');
            LocalDateTime ldt9 = toLocalDateTime(r[9]);
            sb.append(ldt9 != null ? ldt9.format(dtFmt) : "").append(',');
            sb.append(csvEsc(r[10])).append(',');
            LocalDateTime ldt11 = toLocalDateTime(r[11]);
            sb.append(ldt11 != null ? ldt11.format(dtFmt) : "").append('\n');
        }
        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private String csvEsc(Object val) {
        if (val == null) return "";
        String s = val.toString().replace("\"", "\"\"");
        return s.contains(",") || s.contains("\n") ? "\"" + s + "\"" : s;
    }

    // ── toDetailDto — map Review entity → ReviewDetailDto ─────────────────
    private ReviewDetailDto toDetailDto(Review r) {
        List<String> imageUrls = r.getImages() == null ? List.of()
                : r.getImages().stream()
                .sorted(Comparator.comparingInt(
                        com.laptopshop.domain.review.entity.ReviewImage::getSortOrder))
                .map(com.laptopshop.domain.review.entity.ReviewImage::getImageUrl)
                .collect(Collectors.toList());

        ReviewReplyDto reply = null;
        if (r.getReplyText() != null) {
            String byName = r.getRepliedBy() != null
                    ? r.getRepliedBy().getFullName() : "Admin";
            reply = new ReviewReplyDto(byName, r.getReplyText(), r.getRepliedAt());
        }

        // orderCode từ orderItem → order
        String orderCode = null;
        if (r.getOrderItem() != null && r.getOrderItem().getOrder() != null) {
            orderCode = r.getOrderItem().getOrder().getOrderCode();
        }

        return new ReviewDetailDto(
                r.getId(),
                r.getProduct().getId(),
                r.getProduct().getName(),
                r.getProduct().getSku(),
                r.getUser() != null ? r.getUser().getId() : null,
                r.getUser() != null ? r.getUser().getFullName() : null,
                r.getUser() != null ? r.getUser().getEmail() : null,
                r.getRating(),
                r.getTitle(),
                r.getText(),
                imageUrls,
                r.getCreatedAt(),
                r.getStatus() != null ? r.getStatus().name() : null,
                reply,
                orderCode
        );
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