package com.laptopshop.interfaces.rest.admin;

import com.laptopshop.application.admin.inventory.dto.*;
import com.laptopshop.application.admin.inventory.service.AdminInventoryService;
import com.laptopshop.application.admin.inventory.dto.ExportRequestDto;
import com.laptopshop.application.admin.inventory.dto.PageDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Admin REST API — Quản lý tồn kho.
 * Base URL: /api/admin/inventory
 */
@RestController
@RequestMapping("/api/admin/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final AdminInventoryService adminInventoryService;

    private static final String ROLES_ALL  =
            "hasAnyRole('SUPER_ADMIN','STORE_MANAGER')";
    private static final String ROLES_WRITE =
            "hasAnyRole('SUPER_ADMIN','STORE_MANAGER')";
    private static final String ROLES_EXPORT =
            "hasAnyRole('SUPER_ADMIN','STORE_MANAGER')";

    // ── GET /admin/inventory/overview ─────────────────────────────────────────
    @GetMapping("/overview")
    @PreAuthorize(ROLES_ALL)
    public ResponseEntity<InventoryOverviewDto> getOverview() {
        return ResponseEntity.ok(adminInventoryService.getOverview());
    }

    // ── GET /admin/inventory/branches ─────────────────────────────────────────
    @GetMapping("/branches")
    @PreAuthorize(ROLES_ALL)
    public ResponseEntity<List<BranchInventoryDto>> listBranches() {
        return ResponseEntity.ok(adminInventoryService.listBranches());
    }

    // ── GET /admin/inventory/products ─────────────────────────────────────────
    @GetMapping("/products")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<PageDto<ProductInventoryDto>> listProducts(
            @RequestParam(required = false)          Long    branchId,
            @RequestParam(required = false)          String  q,
            @RequestParam(defaultValue = "false")    boolean lowStockOnly,
            @RequestParam(defaultValue = "0")        int     page,
            @RequestParam(defaultValue = "20")       int     size,
            @RequestParam(defaultValue = "name")     String  sort,
            @RequestParam(defaultValue = "asc")      String  dir
    ) {
        Sort.Direction direction = "desc".equalsIgnoreCase(dir)
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by(direction, sort));
        return ResponseEntity.ok(
                adminInventoryService.listProducts(branchId, q, lowStockOnly, pageable));
    }

    // ── GET /admin/inventory/products/{productId}/history ─────────────────────
    @GetMapping("/products/{productId}/history")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<PageDto<InventoryHistoryDto>> getHistory(
            @PathVariable Long productId,
            @RequestParam(required = false)                     Long          branchId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0")                   int           page,
            @RequestParam(defaultValue = "30")                  int           size
    ) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 200),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(
                adminInventoryService.getProductHistory(productId, branchId, fromDate, toDate, pageable));
    }

    // ── GET /admin/inventory/imports ──────────────────────────────────────────
    @GetMapping("/imports")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<PageDto<ImportTicketDto>> listImports(
            @RequestParam(required = false)                     Long          branchId,
            @RequestParam(required = false)                     String        status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0")                   int           page,
            @RequestParam(defaultValue = "20")                  int           size
    ) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(
                adminInventoryService.listImports(branchId, status, fromDate, toDate, pageable));
    }

    // ── POST /admin/inventory/imports ─────────────────────────────────────────
    @PostMapping("/imports")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<ImportTicketDto> createImport(
            @Valid @RequestBody CreateImportRequestDto req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminInventoryService.createImport(req));
    }

    // ── GET /admin/inventory/exports ──────────────────────────────────────────
    @GetMapping("/exports")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<PageDto<ExportTicketDto>> listExports(
            @RequestParam(required = false)                     Long          branchId,
            @RequestParam(required = false)                     String        status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0")                   int           page,
            @RequestParam(defaultValue = "20")                  int           size
    ) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(
                adminInventoryService.listExports(branchId, status, fromDate, toDate, pageable));
    }

    // ── POST /admin/inventory/exports ─────────────────────────────────────────
    @PostMapping("/exports")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<ExportTicketDto> createExport(
            @Valid @RequestBody CreateExportRequestDto req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminInventoryService.createExport(req));
    }

    // ── GET /admin/inventory/transfers ────────────────────────────────────────
    @GetMapping("/transfers")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<PageDto<TransferTicketDto>> listTransfers(
            @RequestParam(required = false)                     Long          fromBranch,
            @RequestParam(required = false)                     Long          toBranch,
            @RequestParam(required = false)                     String        status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0")                   int           page,
            @RequestParam(defaultValue = "20")                  int           size
    ) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(
                adminInventoryService.listTransfers(fromBranch, toBranch, status, fromDate, toDate, pageable));
    }

    // ── POST /admin/inventory/transfers ───────────────────────────────────────
    @PostMapping("/transfers")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<TransferTicketDto> createTransfer(
            @Valid @RequestBody CreateTransferRequestDto req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminInventoryService.createTransfer(req));
    }

    // ── POST /admin/inventory/adjust ──────────────────────────────────────────
    @PostMapping("/adjust")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<Void> adjustStock(
            @Valid @RequestBody AdjustStockRequestDto req
    ) {
        adminInventoryService.adjustStock(req);
        return ResponseEntity.noContent().build();
    }

    // ── GET /admin/inventory/alerts ───────────────────────────────────────────
    @GetMapping("/alerts")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<List<InventoryAlertDto>> listAlerts(
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) Long   branchId
    ) {
        return ResponseEntity.ok(adminInventoryService.listAlerts(severity, branchId));
    }

    // ── GET /admin/inventory/export ───────────────────────────────────────────
    // Đặt SAU /alerts để tránh conflict với path variable
    @GetMapping("/export")
    @PreAuthorize(ROLES_EXPORT)
    public ResponseEntity<byte[]> exportInventory(
            @RequestParam(defaultValue = "PRODUCTS")            String        exportType,
            @RequestParam(required = false)                     String        q,
            @RequestParam(required = false)                     Long          storeId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate
    ) {
        ExportRequestDto req = new ExportRequestDto();
        req.setExportType(exportType);
        req.setQ(q);
        req.setStoreId(storeId);
        req.setFromDate(fromDate);
        req.setToDate(toDate);

        byte[] xlsx = adminInventoryService.exportInventory(req);
        String filename = "inventory-" + exportType.toLowerCase() + "-"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"))
                + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(filename).build());
        return ResponseEntity.ok().headers(headers).body(xlsx);
    }
}
