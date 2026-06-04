package com.laptopshop.interfaces.rest.admin;

import com.laptopshop.application.admin.warranty.dto.AdminWarrantyResponse;
import com.laptopshop.application.admin.warranty.dto.UpdateWarrantyStatusRequest;
import com.laptopshop.application.admin.warranty.service.AdminWarrantyService;
import com.laptopshop.domain.warranty.enums.WarrantyStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Admin Warranty API — dành cho staff xử lý bảo hành
 *
 * GET   /api/admin/warranty              → Danh sách tất cả yêu cầu (filter theo status)
 * GET   /api/admin/warranty/{id}         → Chi tiết 1 yêu cầu
 * PATCH /api/admin/warranty/{id}/status  → Cập nhật trạng thái
 *
 * Security: SUPER_ADMIN, STORE_MANAGER, SALES_STAFF
 * (kế thừa rule /api/admin/** trong SecurityConfig)
 */
@RestController
@RequestMapping("/api/admin/warranty")
@RequiredArgsConstructor
public class AdminWarrantyController {

    private final AdminWarrantyService adminWarrantyService;

    // ── List ──────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<Page<AdminWarrantyResponse>> listAll(
            @RequestParam(required = false) WarrantyStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(adminWarrantyService.listAll(status, pageable));
    }

    // ── Detail ────────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<AdminWarrantyResponse> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminWarrantyService.getDetail(id));
    }

    // ── Update status ─────────────────────────────────────────────────────────

    @PatchMapping("/{id}/status")
    public ResponseEntity<AdminWarrantyResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateWarrantyStatusRequest req,
            Principal principal          // email của staff từ JWT (username = email)
    ) {
        return ResponseEntity.ok(
                adminWarrantyService.updateStatus(id, req, principal.getName())
        );
    }
}
