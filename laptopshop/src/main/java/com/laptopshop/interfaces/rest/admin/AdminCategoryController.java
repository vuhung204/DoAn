package com.laptopshop.interfaces.rest.admin;

import com.laptopshop.application.admin.category.dto.*;
import com.laptopshop.application.admin.category.service.AdminCategoryService;
import com.laptopshop.application.admin.refund.dto.PageDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Admin REST API — Quản lý danh mục sản phẩm.
 * Base URL: /api/admin/categories   ← FIX: thêm /api prefix
 */
@RestController
@RequestMapping("/api/admin/categories")   // ← FIX
@RequiredArgsConstructor
public class AdminCategoryController {

    private final AdminCategoryService adminCategoryService;

    private static final String ROLES_ALL   =
            "hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')";
    private static final String ROLES_READ  =
            "hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')";
    private static final String ROLES_WRITE =
            "hasAnyRole('SUPER_ADMIN','STORE_MANAGER')";

    // ── GET /api/admin/categories/tree ────────────────────────────────────────
    @GetMapping("/tree")
    @PreAuthorize(ROLES_ALL)
    public ResponseEntity<List<CategoryTreeDto>> getTree() {
        return ResponseEntity.ok(adminCategoryService.getCategoryTree());
    }

    // ── GET /api/admin/categories/export ──────────────────────────────────────
    @GetMapping("/export")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<byte[]> exportCategories() {
        byte[] data = adminCategoryService.exportCategories();
        String filename = "categories-"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"))
                + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(filename).build());
        return ResponseEntity.ok().headers(headers).body(data);
    }

    // ── PATCH /api/admin/categories/reorder ───────────────────────────────────
    @PatchMapping("/reorder")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<Void> reorderCategories(
            @Valid @RequestBody ReorderCategoryRequestDto req
    ) {
        adminCategoryService.reorderCategories(req);
        return ResponseEntity.noContent().build();
    }

    // ── GET /api/admin/categories ─────────────────────────────────────────────
    @GetMapping
    @PreAuthorize(ROLES_READ)
    public ResponseEntity<PageDto<CategoryDto>> listCategories(
            @RequestParam(required = false)           String  q,
            @RequestParam(required = false)           Boolean visible,
            @RequestParam(defaultValue = "0")         int     page,
            @RequestParam(defaultValue = "20")        int     size,
            @RequestParam(defaultValue = "sortOrder") String  sort,
            @RequestParam(defaultValue = "asc")       String  dir
    ) {
        Sort.Direction direction = "desc".equalsIgnoreCase(dir)
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by(direction, sort));
        return ResponseEntity.ok(adminCategoryService.listCategories(q, visible, pageable));
    }

    // ── POST /api/admin/categories ────────────────────────────────────────────
    @PostMapping
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<CategoryDto> createCategory(
            @Valid @RequestBody CreateCategoryRequestDto req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminCategoryService.createCategory(req));
    }

    // ── PUT /api/admin/categories/{id} ────────────────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<CategoryDto> updateCategory(
            @PathVariable Long id,
            @RequestBody UpdateCategoryRequestDto req
    ) {
        return ResponseEntity.ok(adminCategoryService.updateCategory(id, req));
    }

    // ── DELETE /api/admin/categories/{id} ─────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean force
    ) {
        adminCategoryService.deleteCategory(id, force);
        return ResponseEntity.noContent().build();
    }

    // ── PATCH /api/admin/categories/{id}/visibility ───────────────────────────
    @PatchMapping("/{id}/visibility")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<Void> setVisibility(
            @PathVariable Long id,
            @Valid @RequestBody CategoryVisibilityRequestDto req
    ) {
        adminCategoryService.setVisibility(id, req.getVisible());
        return ResponseEntity.noContent().build();
    }
}
