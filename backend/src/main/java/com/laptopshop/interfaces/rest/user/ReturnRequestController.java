package com.laptopshop.interfaces.rest.user;

import com.laptopshop.application.customer.refund.dto.ReturnRequestCreateDto;
import com.laptopshop.application.customer.refund.dto.ReturnRequestResponseDto;
import com.laptopshop.application.customer.refund.service.ReturnRequestService;
import com.laptopshop.domain.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Customer Return Request API
 *
 * POST   /api/v1/returns       → Tạo yêu cầu hoàn trả
 * GET    /api/v1/returns        → Danh sách yêu cầu của user
 * GET    /api/v1/returns/{id}   → Chi tiết yêu cầu
 * DELETE /api/v1/returns/{id}   → Hủy yêu cầu (chỉ khi PENDING)
 */
@RestController
@RequestMapping("/api/v1/returns")
@RequiredArgsConstructor
public class ReturnRequestController {

    private final ReturnRequestService service;
    private final UserRepository       userRepository;

    // ── Helper: JwtAuthFilter set principal = email (String) ─────────────────
    // KHÔNG dùng @AuthenticationPrincipal Long — sẽ luôn null vì principal là String.
    private Long getUserId(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"))
                .getId();
    }

    /** POST /api/v1/returns — Tạo yêu cầu hoàn trả */
    @PostMapping
    public ResponseEntity<ReturnRequestResponseDto> create(
            Authentication auth,
            @Valid @RequestBody ReturnRequestCreateDto dto
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.createReturnRequest(getUserId(auth), dto));
    }

    /** GET /api/v1/returns — Danh sách yêu cầu của user (phân trang) */
    @GetMapping
    public Page<ReturnRequestResponseDto> list(
            Authentication auth,
            Pageable pageable
    ) {
        return service.getUserReturnRequests(getUserId(auth), pageable);
    }

    /** GET /api/v1/returns/{id} — Chi tiết */
    @GetMapping("/{id}")
    public ReturnRequestResponseDto detail(
            Authentication auth,
            @PathVariable Long id
    ) {
        return service.getUserReturnDetail(getUserId(auth), id);
    }

    /** DELETE /api/v1/returns/{id} — Hủy yêu cầu */
    @DeleteMapping("/{id}")
    public ReturnRequestResponseDto cancel(
            Authentication auth,
            @PathVariable Long id
    ) {
        return service.cancelReturnRequest(getUserId(auth), id);
    }
}
