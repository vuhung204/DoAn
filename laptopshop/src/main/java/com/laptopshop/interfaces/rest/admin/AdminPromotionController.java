package com.laptopshop.interfaces.rest.admin;

import com.laptopshop.application.admin.promotion.dto.*;
import com.laptopshop.application.admin.promotion.service.AdminPromotionService;
import com.laptopshop.application.admin.refund.dto.PageDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Admin REST API — Quản lý khuyến mãi.
 * Base URL: /api/admin/promotions
 *
 * NOTE về native query sort:
 * Spring Data ghép sort field vào ORDER BY của native SQL dưới dạng:
 *   {alias}.{field}  →  p.{field}
 * Do đó whitelist chỉ trả tên cột DB thuần (snake_case), KHÔNG có prefix alias.
 * Ví dụ: "created_at" (đúng) → Spring tạo "p.created_at"
 *        "p.created_at" (sai) → Spring tạo "p.p.created_at"  ← lỗi vừa fix
 */
@RestController
@RequestMapping("/api/admin/promotions")
@RequiredArgsConstructor
public class AdminPromotionController {

    private final AdminPromotionService adminPromotionService;

    private static final String ROLES_READ  =
            "hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')";
    private static final String ROLES_WRITE =
            "hasAnyRole('SUPER_ADMIN','STORE_MANAGER')";

    // ── GET /api/admin/promotions ─────────────────────────────────────────────
    @GetMapping
    @PreAuthorize(ROLES_READ)
    public ResponseEntity<PageDto<PromotionListDto>> searchPromotions(
            @RequestParam(required = false)                     String        q,
            @RequestParam(required = false)                     String        status,
            @RequestParam(required = false)                     String        type,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0")                   int           page,
            @RequestParam(defaultValue = "20")                  int           size,
            @RequestParam(defaultValue = "created_at")          String        sort,
            @RequestParam(defaultValue = "desc")                String        dir
    ) {
        Sort.Direction direction = "asc".equalsIgnoreCase(dir)
                ? Sort.Direction.ASC : Sort.Direction.DESC;

        // Whitelist sort — chỉ tên cột DB thuần (snake_case), KHÔNG có alias prefix.
        // Spring Data tự ghép alias khi append vào native query ORDER BY clause.
        String safeSort = switch (sort) {
            case "created_at", "createdAt"  -> "created_at";
            case "starts_at",  "startDate"  -> "starts_at";
            case "ends_at",    "endDate"    -> "ends_at";
            case "used_count", "usedCount"  -> "used_count";
            case "name"                     -> "name";
            case "code"                     -> "code";
            default                         -> "created_at";
        };

        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by(direction, safeSort));
        return ResponseEntity.ok(
                adminPromotionService.searchPromotions(q, status, type, fromDate, toDate, pageable));
    }

    // ── GET /api/admin/promotions/validate-code ───────────────────────────────
    @GetMapping("/validate-code")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<PromotionValidateResponseDto> validateCode(
            @RequestParam String code,
            @RequestParam(required = false) Long excludeId
    ) {
        return ResponseEntity.ok(adminPromotionService.validateCode(code, excludeId));
    }

    // ── GET /api/admin/promotions/export ──────────────────────────────────────
    @GetMapping("/export")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<byte[]> exportPromotions(
            @RequestParam(required = false)                     String        q,
            @RequestParam(required = false)                     String        status,
            @RequestParam(required = false)                     String        type,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "XLSX")                String        format
    ) {
        ExportPromotionsRequestDto req = new ExportPromotionsRequestDto();
        req.setQ(q);
        req.setStatus(status);
        req.setType(type);
        req.setFromDate(fromDate);
        req.setToDate(toDate);
        req.setFormat(format);

        byte[] data = adminPromotionService.exportPromotions(req);
        String filename = "promotions-"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"))
                + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(filename).build());
        return ResponseEntity.ok().headers(headers).body(data);
    }

    // ── GET /api/admin/promotions/{id} ────────────────────────────────────────
    @GetMapping("/{id}")
    @PreAuthorize(ROLES_READ)
    public ResponseEntity<PromotionDetailDto> getPromotion(@PathVariable Long id) {
        return ResponseEntity.ok(adminPromotionService.getPromotion(id));
    }

    // ── POST /api/admin/promotions ────────────────────────────────────────────
    @PostMapping
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<PromotionDetailDto> createPromotion(
            @Valid @RequestBody PromotionCreateRequestDto req,
            Authentication authentication
    ) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new IllegalStateException("Không xác định được tài khoản thực hiện thao tác");
        }
        String createdBy = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminPromotionService.createPromotion(req, createdBy));
    }

    // ── PUT /api/admin/promotions/{id} ────────────────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<PromotionDetailDto> updatePromotion(
            @PathVariable Long id,
            @RequestBody PromotionUpdateRequestDto req
    ) {
        return ResponseEntity.ok(adminPromotionService.updatePromotion(id, req));
    }

    // ── PATCH /api/admin/promotions/{id}/status ───────────────────────────────
    @PatchMapping("/{id}/status")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<Void> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody PromotionStatusUpdateDto req
    ) {
        adminPromotionService.changeStatus(id, req.getStatus());
        return ResponseEntity.noContent().build();
    }

    // ── DELETE /api/admin/promotions/{id} ─────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<Void> deletePromotion(@PathVariable Long id) {
        adminPromotionService.deletePromotion(id);
        return ResponseEntity.noContent().build();
    }

    // ── POST /api/admin/promotions/{id}/assign-products ───────────────────────
    @PostMapping("/{id}/assign-products")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<Void> assignProducts(
            @PathVariable Long id,
            @Valid @RequestBody PromotionProductAssignRequestDto req
    ) {
        adminPromotionService.assignProducts(id, req);
        return ResponseEntity.noContent().build();
    }
}