package com.laptopshop.interfaces.rest.admin;

import com.laptopshop.application.admin.refund.dto.PageDto;
import com.laptopshop.application.admin.setting.dto.*;
import com.laptopshop.application.admin.setting.service.StaffService;
import com.laptopshop.domain.store.entity.Role;
import com.laptopshop.domain.store.repository.RoleRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Base URL: /api/admin/staff   ← FIX: thêm /api prefix
 */
@RestController
@RequestMapping("/api/admin/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;
    private final RoleRepository roleRepo;    // dùng để trả danh sách roles cho FE form

    private static final String ROLES_READ  = "hasAnyRole('SUPER_ADMIN','STORE_MANAGER')";
    private static final String ROLES_WRITE = "hasAnyRole('SUPER_ADMIN','STORE_MANAGER')";

    // ── GET /api/admin/staff/roles — danh sách roles cho FE form select ───────
    // Đặt TRƯỚC /{id}
    @GetMapping("/roles")
    @PreAuthorize(ROLES_READ)
    public ResponseEntity<List<Map<String, Object>>> getRoles() {
        List<Map<String, Object>> roles = roleRepo.findAll().stream()
                .map(r -> Map.<String, Object>of("id", r.getId(), "name", r.getName()))
                .toList();
        return ResponseEntity.ok(roles);
    }

    // ── GET /api/admin/staff/export ───────────────────────────────────────────
    // Đặt TRƯỚC /{id}
    @GetMapping("/export")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) Long   storeId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        byte[] data = staffService.exportStaff(storeId, role, status);
        String filename = "staff-"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"))
                + ".xlsx";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        return ResponseEntity.ok().headers(headers).body(data);
    }

    @GetMapping
    @PreAuthorize(ROLES_READ)
    public ResponseEntity<PageDto<StaffListDto>> search(
            @RequestParam(required = false)          String q,
            @RequestParam(required = false)          Long   storeId,
            @RequestParam(required = false)          String role,
            @RequestParam(required = false)          String status,
            @RequestParam(defaultValue = "0")        int    page,
            @RequestParam(defaultValue = "20")       int    size,
            @RequestParam(defaultValue = "fullName") String sort,
            @RequestParam(defaultValue = "asc")      String dir
    ) {
        Sort.Direction direction = "desc".equalsIgnoreCase(dir)
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by(direction, sort));
        return ResponseEntity.ok(
                staffService.searchStaff(q, storeId, role, status, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize(ROLES_READ)
    public ResponseEntity<StaffDetailDto> getStaff(@PathVariable Long id) {
        return ResponseEntity.ok(staffService.getStaff(id));
    }

    @PostMapping
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<StaffDetailDto> createStaff(
            @Valid @RequestBody StaffCreateRequestDto req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(staffService.createStaff(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<StaffDetailDto> updateStaff(
            @PathVariable Long id,
            @RequestBody StaffUpdateRequestDto req) {
        return ResponseEntity.ok(staffService.updateStaff(id, req));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<Void> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateDto req) {
        staffService.changeStatus(id, req.getStatus());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        staffService.deleteStaff(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<Map<String, String>> resetPassword(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        boolean sendEmail = body != null && Boolean.TRUE.equals(body.get("sendEmail"));
        staffService.resetPassword(id, sendEmail);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }
}
