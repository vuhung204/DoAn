package com.laptopshop.interfaces.rest.user;

import com.laptopshop.application.customer.warranty.dto.CreateWarrantyRequest;
import com.laptopshop.application.customer.warranty.dto.WarrantyResponse;
import com.laptopshop.application.customer.warranty.service.WarrantyService;
import com.laptopshop.domain.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Customer Warranty API
 *
 * POST   /api/warranty              → Tạo yêu cầu bảo hành
 * GET    /api/warranty              → Danh sách yêu cầu của tôi (phân trang)
 * GET    /api/warranty/{id}         → Chi tiết 1 yêu cầu
 * PATCH  /api/warranty/{id}/cancel  → Hủy yêu cầu (chỉ khi PENDING)
 */
@RestController
@RequestMapping("/api/warranty")
@RequiredArgsConstructor
public class WarrantyController {

    private final WarrantyService warrantyService;
    private final UserRepository  userRepository;

    // ── Helper: lấy userId từ JWT principal (email string) ───────────────────
    // JwtAuthFilter set principal = email (String), không phải Long hay UserDetails.
    // Dùng pattern giống UserController.getUserId(auth).
    private Long getUserId(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"))
                .getId();
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<WarrantyResponse> create(
            Authentication auth,
            @Valid @RequestBody CreateWarrantyRequest req
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(warrantyService.create(getUserId(auth), req));
    }

    // ── List (phân trang) ─────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<Page<WarrantyResponse>> getMyWarranties(
            Authentication auth,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(warrantyService.getMyWarranties(getUserId(auth), pageable));
    }

    // ── Detail ────────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<WarrantyResponse> getDetail(
            Authentication auth,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(warrantyService.getDetail(getUserId(auth), id));
    }

    // ── Cancel ────────────────────────────────────────────────────────────────

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<WarrantyResponse> cancel(
            Authentication auth,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(warrantyService.cancel(getUserId(auth), id));
    }
}