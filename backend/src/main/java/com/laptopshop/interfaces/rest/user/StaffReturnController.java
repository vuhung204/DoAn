package com.laptopshop.interfaces.rest.user;

import com.laptopshop.application.customer.refund.dto.RefundCompleteDto;
import com.laptopshop.application.customer.refund.dto.ReturnProcessDto;
import com.laptopshop.application.customer.refund.dto.ReturnRequestResponseDto;
import com.laptopshop.application.customer.refund.service.ReturnRequestService;
import com.laptopshop.domain.refund.enums.ReturnStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/staff/returns")
@RequiredArgsConstructor
public class StaffReturnController {

    private final ReturnRequestService service;

    /** GET /api/v1/staff/returns?status=PENDING */
    @GetMapping
    public Page<ReturnRequestResponseDto> list(
            @RequestParam(required = false) ReturnStatus status,
            Pageable pageable) {
        return service.getReturnsByStatus(status, pageable);
    }

    /** GET /api/v1/staff/returns/{id} */
    @GetMapping("/{id}")
    public ReturnRequestResponseDto detail(@PathVariable Long id) {
        return service.getReturnDetail(id);
    }

    /** POST /api/v1/staff/returns/{id}/approve */
    @PostMapping("/{id}/approve")
    public ReturnRequestResponseDto approve(
            @AuthenticationPrincipal Long staffId,
            @PathVariable Long id,
            @RequestBody ReturnProcessDto dto) {
        return service.approveReturn(staffId, id, dto);
    }

    /** POST /api/v1/staff/returns/{id}/reject */
    @PostMapping("/{id}/reject")
    public ReturnRequestResponseDto reject(
            @AuthenticationPrincipal Long staffId,
            @PathVariable Long id,
            @RequestBody ReturnProcessDto dto) {
        return service.rejectReturn(staffId, id, dto);
    }

    /** POST /api/v1/staff/returns/{id}/receive */
    @PostMapping("/{id}/receive")
    public ReturnRequestResponseDto receive(
            @AuthenticationPrincipal Long staffId,
            @PathVariable Long id) {
        return service.markReceived(staffId, id);
    }

    /** POST /api/v1/staff/returns/{id}/refund */
    @PostMapping("/{id}/refund")
    public ReturnRequestResponseDto refund(
            @AuthenticationPrincipal Long staffId,
            @PathVariable Long id,
            @Valid @RequestBody RefundCompleteDto dto) {
        return service.completeRefund(staffId, id, dto);
    }
}
