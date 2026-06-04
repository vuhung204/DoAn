package com.laptopshop.application.customer.warranty.service;

import com.laptopshop.application.customer.notification.service.NotificationService;
import com.laptopshop.application.customer.warranty.dto.CreateWarrantyRequest;
import com.laptopshop.application.customer.warranty.dto.WarrantyResponse;
import com.laptopshop.domain.order.entity.OrderItem;
import com.laptopshop.domain.order.enums.OrderStatus;
import com.laptopshop.domain.order.repository.OrderItemRepository;
import com.laptopshop.domain.user.entity.User;
import com.laptopshop.domain.user.repository.UserRepository;
import com.laptopshop.domain.warranty.entity.WarrantyRequest;
import com.laptopshop.domain.warranty.enums.WarrantyStatus;
import com.laptopshop.domain.warranty.repository.WarrantyRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class WarrantyService {

    private final WarrantyRequestRepository warrantyRepo;
    private final OrderItemRepository       orderItemRepo;
    private final UserRepository            userRepo;
    private final NotificationService       notificationService;

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public WarrantyResponse create(Long userId, CreateWarrantyRequest req) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy user"));

        OrderItem item = orderItemRepo.findById(req.orderItemId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm trong đơn hàng"));

        if (!item.getOrder().getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bạn không có quyền tạo yêu cầu bảo hành cho đơn hàng này");
        }

        if (item.getOrder().getStatus() != OrderStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể yêu cầu bảo hành cho đơn hàng đã hoàn thành");
        }

        if (warrantyRepo.existsActiveByOrderItemId(req.orderItemId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Sản phẩm này đã có yêu cầu bảo hành đang được xử lý");
        }

        WarrantyRequest warranty = new WarrantyRequest();
        warranty.setUser(user);
        warranty.setOrder(item.getOrder());
        warranty.setOrderItem(item);
        warranty.setIssueDescription(req.issueDescription());
        warranty.setStatus(WarrantyStatus.PENDING);

        WarrantyRequest saved = warrantyRepo.save(warranty);

        return WarrantyResponse.from(
                warrantyRepo.findByIdWithDetails(saved.getId()).orElseThrow());
    }

    // ── List ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<WarrantyResponse> getMyWarranties(Long userId, Pageable pageable) {
        return warrantyRepo
                .findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(WarrantyResponse::summary);
    }

    // ── Detail ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public WarrantyResponse getDetail(Long userId, Long warrantyId) {
        WarrantyRequest warranty = warrantyRepo.findByIdWithDetails(warrantyId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu bảo hành"));

        if (!warranty.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bạn không có quyền xem yêu cầu bảo hành này");
        }

        return WarrantyResponse.from(warranty);
    }

    // ── Cancel ────────────────────────────────────────────────────────────────

    @Transactional
    public WarrantyResponse cancel(Long userId, Long warrantyId) {
        WarrantyRequest warranty = warrantyRepo.findByIdAndUserId(warrantyId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu bảo hành"));

        if (warranty.getStatus() != WarrantyStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể hủy yêu cầu bảo hành khi đang ở trạng thái chờ xử lý");
        }

        warranty.setStatus(WarrantyStatus.CANCELLED);
        warrantyRepo.save(warranty);

        notificationService.pushWarrantyStatus(userId, warrantyId, "CANCELLED");

        return WarrantyResponse.from(
                warrantyRepo.findByIdWithDetails(warrantyId).orElseThrow());
    }
}