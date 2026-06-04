package com.laptopshop.application.admin.warranty.service;

import com.laptopshop.application.admin.warranty.dto.AdminWarrantyResponse;
import com.laptopshop.application.admin.warranty.dto.UpdateWarrantyStatusRequest;
import com.laptopshop.application.customer.notification.service.NotificationService;
import com.laptopshop.domain.store.entity.Staff;
import com.laptopshop.domain.store.repository.StaffRepository;
import com.laptopshop.domain.warranty.entity.WarrantyRequest;
import com.laptopshop.domain.warranty.enums.WarrantyStatus;
import com.laptopshop.domain.warranty.repository.WarrantyRequestRepository;
import com.laptopshop.infrastructure.security.StoreAccessGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminWarrantyService {

    private final WarrantyRequestRepository warrantyRepo;
    private final StaffRepository           staffRepo;
    private final NotificationService       notificationService;
    private final StoreAccessGuard storeAccessGuard;

    // ── List ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AdminWarrantyResponse> listAll(WarrantyStatus status, Pageable pageable) {
        Page<WarrantyRequest> page = (status != null)
                ? warrantyRepo.findByStatusOrderByCreatedAtDesc(status, pageable)
                : warrantyRepo.findAllByOrderByCreatedAtDesc(pageable);
        return page.map(AdminWarrantyResponse::from);
    }

    // ── Detail ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AdminWarrantyResponse getDetail(Long warrantyId) {
        return AdminWarrantyResponse.from(findOrThrow(warrantyId));
    }

    // ── Update status ─────────────────────────────────────────────────────────

    @Transactional
    public AdminWarrantyResponse updateStatus(Long warrantyId,
                                              UpdateWarrantyStatusRequest req,
                                              String staffEmail) {

        WarrantyRequest warranty = findOrThrow(warrantyId);

        // [PATCH] Dùng loadStaffByEmail thay vì findByEmail để load đủ role + store
        // rồi kiểm tra chi nhánh ngay, không cần gọi thêm DB lần thứ 2
        Staff staff = storeAccessGuard.loadStaffByEmail(staffEmail);

        // [PATCH] Kiểm tra staff chỉ được xử lý warranty thuộc chi nhánh mình.
        // Warranty gắn với order → order gắn với store.
        if (warranty.getOrder() != null && warranty.getOrder().getStore() != null) {
            storeAccessGuard.assertCanAccessStore(
                    staffEmail, warranty.getOrder().getStore().getId());
        }

        WarrantyStatus current = warranty.getStatus();
        WarrantyStatus next    = req.newStatus();

        if (!current.canTransitionTo(next)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Không thể chuyển trạng thái từ " + current + " sang " + next);
        }

        switch (next) {
            case APPROVED -> {
                warranty.setHandledBy(staff);
                warranty.setProcessedAt(LocalDateTime.now());
                if (hasText(req.staffNote())) warranty.setStaffNote(req.staffNote());
            }
            case REJECTED -> {
                if (!hasText(req.rejectionReason())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Vui lòng nhập lý do từ chối");
                }
                warranty.setHandledBy(staff);
                warranty.setProcessedAt(LocalDateTime.now());
                warranty.setRejectionReason(req.rejectionReason().trim());
                if (hasText(req.staffNote())) warranty.setStaffNote(req.staffNote());
            }
            case IN_REPAIR -> {
                if (hasText(req.staffNote())) warranty.setStaffNote(req.staffNote());
            }
            case COMPLETED -> {
                warranty.setCompletedAt(LocalDateTime.now());
                if (hasText(req.staffNote())) warranty.setStaffNote(req.staffNote());
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Trạng thái không hợp lệ: " + next);
        }

        warranty.setStatus(next);
        warrantyRepo.save(warranty);

        try {
            if (warranty.getUser() != null) {
                notificationService.pushWarrantyStatus(
                        warranty.getUser().getId(),
                        warrantyId,
                        next.name()
                );
            }
        } catch (Exception e) {
            // Không để lỗi notification fail transaction chính
        }

        return AdminWarrantyResponse.from(
                warrantyRepo.findByIdWithDetails(warrantyId).orElseThrow()
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private WarrantyRequest findOrThrow(Long id) {
        return warrantyRepo.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy yêu cầu bảo hành #" + id));
    }

    private boolean hasText(String s) {
        return s != null && !s.isBlank();
    }
}