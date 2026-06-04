package com.laptopshop.application.customer.refund.service;

import com.laptopshop.application.customer.notification.service.NotificationService;
import com.laptopshop.application.customer.refund.dto.RefundCompleteDto;
import com.laptopshop.application.customer.refund.dto.ReturnProcessDto;
import com.laptopshop.application.customer.refund.dto.ReturnRequestCreateDto;
import com.laptopshop.application.customer.refund.dto.ReturnRequestResponseDto;
import com.laptopshop.domain.inventory.entity.InventoryTransaction;
import com.laptopshop.domain.inventory.enums.InventoryTransactionType;
import com.laptopshop.domain.inventory.repository.InventoryTransactionRepository;
import com.laptopshop.domain.inventory.repository.StoreInventoryRepository;
import com.laptopshop.domain.order.entity.Order;
import com.laptopshop.domain.order.entity.OrderItem;
import com.laptopshop.domain.order.enums.OrderStatus;
import com.laptopshop.domain.order.repository.OrderRepository;
import com.laptopshop.domain.store.entity.Staff;
import com.laptopshop.domain.store.repository.StaffRepository;
import com.laptopshop.domain.refund.entity.RefundAudit;
import com.laptopshop.domain.refund.entity.ReturnRequest;
import com.laptopshop.domain.refund.entity.ReturnRequestItem;
import com.laptopshop.domain.refund.enums.ReturnStatus;
import com.laptopshop.domain.refund.repository.RefundAuditRepository;
import com.laptopshop.domain.refund.repository.ReturnRequestItemRepository;
import com.laptopshop.domain.refund.repository.ReturnRequestRepository;
import com.laptopshop.domain.user.entity.User;
import com.laptopshop.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReturnRequestService {

    private final ReturnRequestRepository        returnRepo;
    private final ReturnRequestItemRepository    itemRepo;
    private final RefundAuditRepository          auditRepo;
    private final OrderRepository                orderRepo;
    private final UserRepository                 userRepo;
    private final StaffRepository                staffRepo;
    private final StoreInventoryRepository       storeInventoryRepo;
    private final InventoryTransactionRepository inventoryTxnRepo;
    private final NotificationService            notificationService;

    // ─────────────────────────────────────────────────────────────────────────
    // USER ACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public ReturnRequestResponseDto createReturnRequest(Long userId,
                                                        ReturnRequestCreateDto dto) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Order order = orderRepo.findById(dto.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể yêu cầu hoàn trả đơn hàng đã hoàn thành");
        }

        if (!order.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Không có quyền truy cập đơn hàng này");
        }

        boolean hasActiveRequest = returnRepo.existsByOrder_IdAndUser_IdAndStatusNotIn(
                order.getId(), userId,
                List.of(ReturnStatus.REJECTED, ReturnStatus.CANCELLED));
        if (hasActiveRequest) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Đơn hàng này đã có yêu cầu hoàn trả đang xử lý");
        }

        Map<Long, OrderItem> orderItemMap = order.getItems().stream()
                .collect(Collectors.toMap(OrderItem::getId, Function.identity()));

        ReturnRequest returnRequest = new ReturnRequest();
        returnRequest.setOrder(order);
        returnRequest.setUser(user);
        returnRequest.setReason(dto.getReason());
        returnRequest.setStatus(ReturnStatus.PENDING);

        List<ReturnRequestItem> items = dto.getItems().stream().map(itemDto -> {
            OrderItem orderItem = orderItemMap.get(itemDto.getOrderItemId());
            if (orderItem == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "OrderItem không tồn tại trong đơn hàng: " + itemDto.getOrderItemId());
            }
            if (itemDto.getQuantity() > orderItem.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Số lượng hoàn trả vượt quá số lượng mua: "
                                + orderItem.getProduct().getName());
            }

            ReturnRequestItem ri = new ReturnRequestItem();
            ri.setReturnRequest(returnRequest);
            ri.setOrderItem(orderItem);
            ri.setQuantity(itemDto.getQuantity());
            ri.setReason(itemDto.getReason());
            ri.setRefundAmount(orderItem.getUnitPrice()
                    .multiply(BigDecimal.valueOf(itemDto.getQuantity())));
            return ri;
        }).collect(Collectors.toList());

        returnRequest.setItems(items);
        returnRequest.setRefundAmount(
                items.stream()
                        .map(ReturnRequestItem::getRefundAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));

        ReturnRequest saved = returnRepo.save(returnRequest);
        saveAudit(saved, null, ReturnStatus.PENDING, null,
                "Khách hàng tạo yêu cầu hoàn trả");

        return toDto(saved);
    }

    @Transactional
    public ReturnRequestResponseDto cancelReturnRequest(Long userId, Long returnId) {
        ReturnRequest rr = getReturnRequest(returnId);

        if (!rr.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Không có quyền hủy yêu cầu này");
        }
        if (rr.getStatus() != ReturnStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể huỷ yêu cầu đang ở trạng thái PENDING");
        }

        ReturnStatus old = rr.getStatus();
        rr.setStatus(ReturnStatus.CANCELLED);
        rr.setProcessedAt(LocalDateTime.now());

        ReturnRequest saved = returnRepo.save(rr);
        saveAudit(saved, old, ReturnStatus.CANCELLED, null, "Khách hàng huỷ yêu cầu");

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<ReturnRequestResponseDto> getUserReturnRequests(Long userId, Pageable pageable) {
        return returnRepo.findByUser_Id(userId, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public ReturnRequestResponseDto getUserReturnDetail(Long userId, Long returnId) {
        ReturnRequest rr = getReturnRequest(returnId);
        if (!rr.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Không có quyền xem yêu cầu này");
        }
        return toDto(rr);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STAFF ACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ReturnRequestResponseDto> getReturnsByStatus(ReturnStatus status,
                                                             Pageable pageable) {
        if (status == null) return returnRepo.findAll(pageable).map(this::toDto);
        return returnRepo.findByStatus(status, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public ReturnRequestResponseDto getReturnDetail(Long returnId) {
        return toDto(getReturnRequest(returnId));
    }

    @Transactional
    public ReturnRequestResponseDto approveReturn(Long staffId, Long returnId,
                                                  ReturnProcessDto dto) {
        ReturnRequest rr    = getReturnRequest(returnId);
        Staff         staff = getStaff(staffId);

        if (rr.getStatus() != ReturnStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể duyệt yêu cầu đang PENDING");
        }

        ReturnStatus old = rr.getStatus();
        rr.setStatus(ReturnStatus.APPROVED);
        rr.setStaff(staff);
        rr.setStaffNote(dto.getStaffNote());
        rr.setProcessedAt(LocalDateTime.now());

        ReturnRequest saved = returnRepo.save(rr);
        saveAudit(saved, old, ReturnStatus.APPROVED, staff, dto.getStaffNote());

        notificationService.pushReturnStatus(
                saved.getUser().getId(), saved.getId(), "APPROVED");

        return toDto(saved);
    }

    @Transactional
    public ReturnRequestResponseDto rejectReturn(Long staffId, Long returnId,
                                                 ReturnProcessDto dto) {
        ReturnRequest rr    = getReturnRequest(returnId);
        Staff         staff = getStaff(staffId);

        if (rr.getStatus() != ReturnStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể từ chối yêu cầu đang PENDING");
        }

        ReturnStatus old = rr.getStatus();
        rr.setStatus(ReturnStatus.REJECTED);
        rr.setStaff(staff);
        rr.setStaffNote(dto.getStaffNote());
        rr.setProcessedAt(LocalDateTime.now());

        ReturnRequest saved = returnRepo.save(rr);
        saveAudit(saved, old, ReturnStatus.REJECTED, staff, dto.getStaffNote());

        notificationService.pushReturnStatus(
                saved.getUser().getId(), saved.getId(), "REJECTED");

        return toDto(saved);
    }

    @Transactional
    public ReturnRequestResponseDto markReceived(Long staffId, Long returnId) {
        ReturnRequest rr    = getReturnRequest(returnId);
        Staff         staff = getStaff(staffId);

        if (rr.getStatus() != ReturnStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể xác nhận nhận hàng khi yêu cầu đã APPROVED");
        }

        ReturnStatus old = rr.getStatus();
        rr.setStatus(ReturnStatus.RECEIVED);
        rr.setProcessedAt(LocalDateTime.now());

        rr.getItems().forEach(item -> restoreInventory(rr, item, staff));

        ReturnRequest saved = returnRepo.save(rr);
        saveAudit(saved, old, ReturnStatus.RECEIVED, staff, "Đã nhận hàng hoàn trả");

        notificationService.pushReturnStatus(
                saved.getUser().getId(), saved.getId(), "RECEIVED");

        return toDto(saved);
    }

    @Transactional
    public ReturnRequestResponseDto completeRefund(Long staffId, Long returnId,
                                                   RefundCompleteDto dto) {
        ReturnRequest rr    = getReturnRequest(returnId);
        Staff         staff = getStaff(staffId);

        if (rr.getStatus() != ReturnStatus.RECEIVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể hoàn tiền khi hàng đã được nhận (RECEIVED)");
        }

        ReturnStatus old = rr.getStatus();
        rr.setStatus(ReturnStatus.REFUNDED);
        rr.setRefundAmount(dto.getRefundAmount());
        rr.setRefundMethod(dto.getRefundMethod());
        rr.setTransactionRef(dto.getTransactionRef());
        rr.setStaffNote(dto.getStaffNote());
        rr.setProcessedAt(LocalDateTime.now());

        Order order = rr.getOrder();
        order.setStatus(OrderStatus.REFUNDED);
        orderRepo.save(order);

        ReturnRequest saved = returnRepo.save(rr);
        saveAudit(saved, old, ReturnStatus.REFUNDED, staff,
                "Hoàn tiền " + dto.getRefundAmount() + " VNĐ qua " + dto.getRefundMethod());

        notificationService.pushRefundCompleted(
                saved.getUser().getId(),
                saved.getId(),
                dto.getRefundAmount().longValue(),
                dto.getRefundMethod());

        return toDto(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private ReturnRequest getReturnRequest(Long id) {
        return returnRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Return request not found: " + id));
    }

    private Staff getStaff(Long staffId) {
        return staffRepo.findById(staffId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Staff not found: " + staffId));
    }

    private void saveAudit(ReturnRequest rr, ReturnStatus old, ReturnStatus newStatus,
                           Staff staff, String note) {
        RefundAudit audit = new RefundAudit();
        audit.setReturnRequest(rr);
        audit.setOldStatus(old);
        audit.setNewStatus(newStatus);
        audit.setStaff(staff);
        audit.setNote(note);
        auditRepo.save(audit);
    }

    private void restoreInventory(ReturnRequest rr, ReturnRequestItem item, Staff staff) {
        var orderItem = item.getOrderItem();
        var product   = orderItem.getProduct();
        var store     = rr.getOrder().getStore();

        storeInventoryRepo.findByStore_IdAndProduct_Id(store.getId(), product.getId())
                .ifPresent(inv -> {
                    inv.setQuantity(inv.getQuantity() + item.getQuantity());
                    storeInventoryRepo.save(inv);
                });

        InventoryTransaction txn = new InventoryTransaction();
        txn.setStore(store);
        txn.setProduct(product);
        txn.setQuantityDelta(item.getQuantity());
        txn.setTransactionType(InventoryTransactionType.RETURN_IN);
        txn.setReturnRequest(rr);
        txn.setStaff(staff);
        txn.setNote("Hoàn trả từ return request #" + rr.getId());
        inventoryTxnRepo.save(txn);
    }

    private ReturnRequestResponseDto toDto(ReturnRequest rr) {
        List<ReturnRequestResponseDto.ReturnItemResponseDto> itemDtos = rr.getItems().stream()
                .map(i -> ReturnRequestResponseDto.ReturnItemResponseDto.builder()
                        .orderItemId(i.getOrderItem().getId())
                        .productId(i.getOrderItem().getProduct().getId())
                        .productName(i.getOrderItem().getProduct().getName())
                        .productSku(i.getOrderItem().getProduct().getSku())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getOrderItem().getUnitPrice())
                        .reason(i.getReason())
                        .refundAmount(i.getRefundAmount())
                        .build())
                .collect(Collectors.toList());

        List<ReturnRequestResponseDto.AuditLogDto> auditDtos = rr.getAuditLogs() == null
                ? new ArrayList<>()
                : rr.getAuditLogs().stream()
                .map(a -> ReturnRequestResponseDto.AuditLogDto.builder()
                        .oldStatus(a.getOldStatus())
                        .newStatus(a.getNewStatus())
                        .staffName(a.getStaff() != null ? a.getStaff().getFullName() : "System")
                        .note(a.getNote())
                        .createdAt(a.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ReturnRequestResponseDto.builder()
                .returnId(rr.getId())
                .orderId(rr.getOrder().getId())
                .orderCode(rr.getOrder().getOrderCode())
                .status(rr.getStatus())
                .reason(rr.getReason())
                .staffNote(rr.getStaffNote())
                .refundAmount(rr.getRefundAmount())
                .refundMethod(rr.getRefundMethod())
                .transactionRef(rr.getTransactionRef())
                .requestedAt(rr.getRequestedAt())
                .processedAt(rr.getProcessedAt())
                .items(itemDtos)
                .auditLogs(auditDtos)
                .build();
    }
}