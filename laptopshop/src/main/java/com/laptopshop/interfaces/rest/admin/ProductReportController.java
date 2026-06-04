package com.laptopshop.interfaces.rest.admin;


import com.laptopshop.application.admin.dashboard.dto.PageDto;
import com.laptopshop.application.admin.productreport.dto.*;
import com.laptopshop.application.admin.productreport.service.ProductReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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
@RequestMapping("/api/admin/products/report")  // FIX: thêm /api prefix
@RequiredArgsConstructor
public class ProductReportController {

    private final ProductReportService productReportService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<ProductReportSummaryDto> getSummary(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) Long categoryId
    ) {
        return ResponseEntity.ok(
                productReportService.getSummary(period, endDate, storeId, categoryId)
        );
    }

    @GetMapping("/product-stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<List<ProductStatDto>> getProductStats(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long storeId
    ) {
        return ResponseEntity.ok(
                productReportService.getProductStats(period, startDate, endDate, storeId)
        );
    }

    @GetMapping("/top-products")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<List<TopProductDto>> getTopProducts(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(
                productReportService.getTopProducts(period, startDate, endDate,
                        storeId, categoryId, limit)
        );
    }

    @GetMapping("/overstock")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<PageDto<OverstockItemDto>> getOverstock(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false)   Long storeId,
            @RequestParam(defaultValue = "3")  int monthsWindow,
            @RequestParam(defaultValue = "6")  int monthsThreshold,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(
                productReportService.getOverstockItems(startDate, endDate, storeId,
                        PageRequest.of(page, size), monthsWindow, monthsThreshold)
        );
    }

    @GetMapping("/deadstock")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<PageDto<DeadStockItemDto>> getDeadstock(
            @RequestParam(defaultValue = "28") int lookbackDays,
            @RequestParam(required = false) Long storeId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(
                productReportService.getDeadStockItems(lookbackDays, storeId,
                        PageRequest.of(page, size))
        );
    }

    @GetMapping("/category-breakdown")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<List<CategoryBreakdownDto>> getCategoryBreakdown(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long storeId
    ) {
        LocalDate end   = endDate   != null ? endDate   : LocalDate.now();
        LocalDate start = startDate != null ? startDate : end.minusDays(29);
        return ResponseEntity.ok(
                productReportService.getCategoryBreakdown(start, end, storeId)
        );
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<byte[]> export(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String storeIds,
            @RequestParam(required = false) String categoryIds,
            @RequestParam(defaultValue = "SUMMARY") String type
    ) {
        ProductReportExportRequestDto req = new ProductReportExportRequestDto(
                period, startDate, endDate,
                parseLongs(storeIds), parseLongs(categoryIds), type
        );
        byte[] bytes   = productReportService.exportReport(req);
        String filename = "products-report-" + type.toLowerCase()
                + "-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(bytes.length);
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    private List<Long> parseLongs(String raw) {
        if (raw == null || raw.isBlank()) return null;
        return Arrays.stream(raw.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .map(Long::parseLong)
                .collect(Collectors.toList());
    }
}
