package com.laptopshop.interfaces.rest.admin;

import com.laptopshop.application.admin.revenue.dto.BranchComparisonDto;
import com.laptopshop.application.admin.revenue.dto.BranchRevenueDto;
import com.laptopshop.application.admin.revenue.dto.RevenueExportRequestDto;
import com.laptopshop.application.admin.revenue.dto.RevenueSeriesPointDto;
import com.laptopshop.application.admin.revenue.dto.RevenueSummaryDto;
import com.laptopshop.application.admin.revenue.dto.YearlyRevenueDto;
import com.laptopshop.application.admin.revenue.service.RevenueService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/revenue")   // FIX: thêm /api prefix
@RequiredArgsConstructor
public class RevenueController {

    private final RevenueService revenueService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STORE_MANAGER', 'SALES_STAFF')")
    public ResponseEntity<RevenueSummaryDto> getSummary(
            @RequestParam(defaultValue = "day") String mode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String branchIds,
            @RequestParam(required = false) Long storeId
    ) {
        List<Long> ids = parseBranchIds(branchIds);
        if (storeId != null && !ids.contains(storeId)) ids.add(storeId);
        return ResponseEntity.ok(
                revenueService.getSummary(mode, startDate, endDate, ids.isEmpty() ? null : ids)
        );
    }

    @GetMapping("/series")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STORE_MANAGER', 'SALES_STAFF')")
    public ResponseEntity<List<RevenueSeriesPointDto>> getSeries(
            @RequestParam(defaultValue = "day") String mode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String branchIds
    ) {
        List<Long> ids = parseBranchIds(branchIds);
        LocalDate start = startDate != null ? startDate : defaultStart(mode);
        LocalDate end   = endDate   != null ? endDate   : LocalDate.now();
        return ResponseEntity.ok(
                revenueService.getSeries(mode, start, end, ids.isEmpty() ? null : ids)
        );
    }

    @GetMapping("/branches")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STORE_MANAGER')")
    public ResponseEntity<List<BranchRevenueDto>> getBranches(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer limit
    ) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(29);
        LocalDate end   = endDate   != null ? endDate   : LocalDate.now();
        return ResponseEntity.ok(revenueService.getBranchRevenues(start, end, limit));
    }

    @GetMapping("/compare-branches")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STORE_MANAGER', 'SALES_STAFF')")
    public ResponseEntity<List<BranchComparisonDto>> compareBranches(
            @RequestParam(defaultValue = "day") String mode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate prevStartDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate prevEndDate,
            @RequestParam(defaultValue = "revenue") String sortBy,
            @RequestParam(required = false) Integer limit
    ) {
        return ResponseEntity.ok(
                revenueService.compareBranches(mode, startDate, endDate,
                        prevStartDate, prevEndDate, sortBy, limit)
        );
    }

    @GetMapping("/yearly")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STORE_MANAGER', 'SALES_STAFF')")
    public ResponseEntity<List<YearlyRevenueDto>> getYearly(
            @RequestParam(required = false) Integer startYear,
            @RequestParam(required = false) Integer endYear
    ) {
        int currentYear = LocalDate.now().getYear();
        int sy = startYear != null ? startYear : currentYear - 4;
        int ey = endYear   != null ? endYear   : currentYear;
        return ResponseEntity.ok(revenueService.getYearlyRevenue(sy, ey));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STORE_MANAGER')")
    public ResponseEntity<byte[]> exportRevenue(
            @RequestParam(defaultValue = "day") String mode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String branchIds,
            @RequestParam(defaultValue = "SUMMARY") String type
    ) {
        List<Long> ids = parseBranchIds(branchIds);
        RevenueExportRequestDto req = new RevenueExportRequestDto(
                mode, startDate, endDate, ids.isEmpty() ? null : ids, type);
        byte[] fileBytes = revenueService.exportRevenue(req);
        String filename  = "revenue-" + mode.toLowerCase()
                + "-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(fileBytes.length);
        return ResponseEntity.ok().headers(headers).body(fileBytes);
    }

    private List<Long> parseBranchIds(String raw) {
        if (raw == null || raw.isBlank()) return new java.util.ArrayList<>();
        return Arrays.stream(raw.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .map(Long::parseLong)
                .collect(Collectors.toCollection(java.util.ArrayList::new));
    }

    private LocalDate defaultStart(String mode) {
        return switch (mode.toLowerCase()) {
            case "year"  -> LocalDate.of(LocalDate.now().getYear() - 4, 1, 1);
            case "month" -> LocalDate.now().withDayOfMonth(1).minusMonths(11);
            default      -> LocalDate.now().minusDays(29);
        };
    }
}
