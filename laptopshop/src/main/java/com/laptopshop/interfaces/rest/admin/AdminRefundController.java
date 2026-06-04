package com.laptopshop.interfaces.rest.admin;

import com.laptopshop.application.admin.refund.dto.PageDto;
import com.laptopshop.application.admin.refund.dto.*;
import com.laptopshop.application.admin.refund.service.AdminRefundService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Admin REST API — Quản lý hoàn tiền / refund.
 * Base URL: /api/admin/refunds   ← FIX: thêm /api prefix
 */
@RestController
@RequestMapping("/api/admin/refunds")   // ← FIX: /admin/refunds → /api/admin/refunds
@RequiredArgsConstructor
public class AdminRefundController {

    private final AdminRefundService refundService;

    private static final String ROLES_READ = "hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')";
    private static final String ROLES_CREATE = "hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')";
    private static final String ROLES_APPROVE_REJECT = "hasAnyRole('SUPER_ADMIN','STORE_MANAGER')";
    private static final String ROLES_COMPLETE = "hasAnyRole('SUPER_ADMIN','STORE_MANAGER')";

    // ── GET /api/admin/refunds ─────────────────────────────────────────────────
    @GetMapping
    @PreAuthorize(ROLES_READ)
    public ResponseEntity<PageDto<RefundListDto>> searchRefunds(
            @RequestParam(required = false)                     String        q,
            @RequestParam(required = false)                     String        status,
            @RequestParam(required = false)                     Long          storeId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0")                   int           page,
            @RequestParam(defaultValue = "20")                  int           size,
            @RequestParam(defaultValue = "requestedAt")         String        sort,
            @RequestParam(defaultValue = "desc")                String        dir
    ) {
        Sort.Direction direction = "asc".equalsIgnoreCase(dir)
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by(direction, sort));
        return ResponseEntity.ok(
                refundService.searchRefunds(q, status, storeId, fromDate, toDate, pageable));
    }

    // ── GET /api/admin/refunds/stats ───────────────────────────────────────────
    // Đặt TRƯỚC /{id} để tránh Spring nhầm "stats" là refundId
    @GetMapping("/stats")
    @PreAuthorize(ROLES_READ)
    public ResponseEntity<RefundStatsDto> getStats(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) Long storeId
    ) {
        LocalDateTime from = fromDate != null ? fromDate : LocalDateTime.now().minusDays(30);
        LocalDateTime to   = toDate   != null ? toDate   : LocalDateTime.now();
        return ResponseEntity.ok(refundService.getStats(from, to, storeId));
    }

    // ── GET /api/admin/refunds/export ──────────────────────────────────────────
    // Đặt TRƯỚC /{id}
    @GetMapping("/export")
    @PreAuthorize(ROLES_READ)
    public ResponseEntity<byte[]> exportRefunds(
            @RequestParam(defaultValue = "LIST")                String        exportType,
            @RequestParam(required = false)                     String        q,
            @RequestParam(required = false)                     String        status,
            @RequestParam(required = false)                     Long          storeId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate
    ) {
        ExportRequestDto req = new ExportRequestDto();
        req.setExportType(exportType);
        req.setQ(q);
        req.setStatus(status);
        req.setStoreId(storeId);
        req.setFromDate(fromDate);
        req.setToDate(toDate);

        byte[] xlsx = refundService.exportRefunds(req);
        String filename = "refunds-"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"))
                + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(filename).build());
        return ResponseEntity.ok().headers(headers).body(xlsx);
    }

    // ── GET /api/admin/refunds/{id} ────────────────────────────────────────────
    @GetMapping("/{id}")
    @PreAuthorize(ROLES_READ)
    public ResponseEntity<RefundDetailDto> getRefund(@PathVariable Long id) {
        return ResponseEntity.ok(refundService.getRefund(id));
    }

    // ── POST /api/admin/refunds ────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize(ROLES_CREATE)
    public ResponseEntity<RefundDetailDto> createRefund(
            @Valid @RequestBody CreateRefundRequestDto req
    ) {
        return ResponseEntity.status(201).body(refundService.createRefund(req));
    }

    // ── PATCH /api/admin/refunds/{id}/approve ─────────────────────────────────
    @PatchMapping("/{id}/approve")
    @PreAuthorize(ROLES_APPROVE_REJECT)
    public ResponseEntity<RefundDetailDto> approveRefund(
            @PathVariable Long id,
            @RequestBody(required = false) ProcessRefundRequestDto req
    ) {
        ProcessRefundRequestDto body = req != null ? req : new ProcessRefundRequestDto();
        return ResponseEntity.ok(refundService.approveRefund(id, body));
    }

    // ── PATCH /api/admin/refunds/{id}/reject ──────────────────────────────────
    @PatchMapping("/{id}/reject")
    @PreAuthorize(ROLES_APPROVE_REJECT)
    public ResponseEntity<RefundDetailDto> rejectRefund(
            @PathVariable Long id,
            @RequestBody(required = false) ProcessRefundRequestDto req
    ) {
        ProcessRefundRequestDto body = req != null ? req : new ProcessRefundRequestDto();
        return ResponseEntity.ok(refundService.rejectRefund(id, body));
    }

    // ── POST /api/admin/refunds/{id}/complete ─────────────────────────────────
    @PostMapping("/{id}/complete")
    @PreAuthorize(ROLES_COMPLETE)
    public ResponseEntity<RefundDetailDto> completeRefund(
            @PathVariable Long id,
            @Valid @RequestBody CompleteRefundRequestDto req
    ) {
        return ResponseEntity.ok(refundService.completeRefund(id, req));
    }
}
