package com.laptopshop.application.admin.refund.service;

import com.laptopshop.application.admin.refund.dto.PageDto;
import com.laptopshop.application.admin.refund.dto.*;
import com.laptopshop.domain.order.entity.Order;
import com.laptopshop.domain.order.enums.OrderStatus;
import com.laptopshop.domain.order.enums.PaymentStatus;
import com.laptopshop.domain.order.repository.OrderRepository;
import com.laptopshop.domain.order.repository.PaymentRepository;
import com.laptopshop.domain.refund.entity.RefundAudit;
import com.laptopshop.domain.refund.entity.ReturnRequest;
import com.laptopshop.domain.refund.enums.ReturnStatus;
import com.laptopshop.domain.refund.repository.RefundAuditRepository;
import com.laptopshop.domain.refund.repository.RefundRepository;
import com.laptopshop.infrastructure.security.StoreAccessGuard;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminRefundServiceImpl implements AdminRefundService {

    private final RefundRepository      refundRepository;
    private final RefundAuditRepository auditRepository;
    private final OrderRepository       orderRepository;
    private final PaymentRepository     paymentRepository;
    private final StoreAccessGuard storeAccessGuard;

    // ─── Status transition rules ──────────────────────────────────────────────
    private static final Map<ReturnStatus, Set<ReturnStatus>> VALID_TRANSITIONS = Map.of(
            ReturnStatus.PENDING,   Set.of(ReturnStatus.APPROVED, ReturnStatus.REJECTED),
            ReturnStatus.APPROVED,  Set.of(ReturnStatus.REFUNDED),
            ReturnStatus.REJECTED,  Set.of(),
            ReturnStatus.REFUNDED,  Set.of(),
            ReturnStatus.RECEIVED,  Set.of(ReturnStatus.REFUNDED),
            ReturnStatus.CANCELLED, Set.of()
    );

    // ─── Frontend ↔ DB status mapping ────────────────────────────────────────
    private static String toFrontend(ReturnStatus s) {
        return switch (s) {
            case PENDING   -> "waiting";
            case APPROVED  -> "approved";
            case REFUNDED  -> "done";
            case REJECTED  -> "rejected";
            case RECEIVED  -> "received";
            case CANCELLED -> "cancelled";
        };
    }

    private static ReturnStatus fromFrontend(String s) {
        return switch (s.toLowerCase().trim()) {
            case "waiting"   -> ReturnStatus.PENDING;
            case "approved"  -> ReturnStatus.APPROVED;
            case "done"      -> ReturnStatus.REFUNDED;
            case "rejected"  -> ReturnStatus.REJECTED;
            case "received"  -> ReturnStatus.RECEIVED;
            case "cancelled" -> ReturnStatus.CANCELLED;
            default -> throw new IllegalArgumentException("Trạng thái không hợp lệ: " + s);
        };
    }

    // ─── SEARCH ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageDto<RefundListDto> searchRefunds(String q, String status, Long storeId,
                                                LocalDateTime from, LocalDateTime to,
                                                Pageable pageable) {
        String dbStatus = parseDbStatus(status);
        Page<ReturnRequest> page = refundRepository.searchRefunds(
                blankToNull(q), dbStatus, storeId, from, to, pageable);
        return PageDto.of(page.map(this::toListDto));
    }

    // ─── DETAIL ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public RefundDetailDto getRefund(Long refundId) {
        ReturnRequest r = refundRepository.findDetailById(refundId)
                .orElseThrow(() -> notFound(refundId));
        return toDetailDto(r);
    }

    // ─── CREATE ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public RefundDetailDto createRefund(CreateRefundRequestDto req) {
        Order order;
        if (req.getOrderId() != null) {
            order = orderRepository.findById(req.getOrderId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng #" + req.getOrderId()));
        } else if (req.getOrderCode() != null && !req.getOrderCode().isBlank()) {
            order = orderRepository.findByOrderCode(req.getOrderCode())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng: " + req.getOrderCode()));
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Phải cung cấp orderId hoặc orderCode");
        }

        // [PATCH] Chỉ được tạo refund cho đơn thuộc chi nhánh mình
        if (order.getStore() != null) {
            storeAccessGuard.assertCanAccessStore(req.getRequestedById(), order.getStore().getId());
        }

        if (order.getStatus() != OrderStatus.COMPLETED
                && order.getStatus() != OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Chỉ có thể hoàn tiền đơn đã hoàn thành hoặc đã huỷ");
        }

        BigDecimal alreadyRefunded = refundRepository.sumRefundedAmount(
                order.getId(), ReturnStatus.REFUNDED);
        BigDecimal refundable = order.getTotalAmount().subtract(alreadyRefunded);
        if (req.getAmount().compareTo(refundable) > 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    String.format("Số tiền hoàn (%.0f) vượt quá số tiền có thể hoàn (%.0f)",
                            req.getAmount(), refundable));
        }

        ReturnRequest rr = new ReturnRequest();
        rr.setOrder(order);
        rr.setUser(order.getUser());
        rr.setRefundAmount(req.getAmount());
        rr.setReason(req.getReason());
        rr.setStatus(ReturnStatus.PENDING);

        ReturnRequest saved = refundRepository.save(rr);
        saveAudit(saved, null, ReturnStatus.PENDING, req.getRequestedById(), null);

        return toDetailDto(saved);
    }

    // ─── APPROVE ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public RefundDetailDto approveRefund(Long refundId, ProcessRefundRequestDto req) {
        ReturnRequest rr = loadAndValidateTransition(refundId, ReturnStatus.APPROVED);

        // [PATCH] Chỉ được approve refund thuộc chi nhánh mình
        assertStaffCanProcessRefund(rr, req.getProcessedById());

        ReturnStatus old = rr.getStatus();
        rr.setStatus(ReturnStatus.APPROVED);
        rr.setStaffNote(req.getNote());
        rr.setProcessedAt(LocalDateTime.now());
        setStaffRef(rr, req.getProcessedById());

        refundRepository.save(rr);
        saveAudit(rr, old, ReturnStatus.APPROVED, req.getProcessedById(), req.getNote());

        return toDetailDto(rr);
    }

    // ─── REJECT ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public RefundDetailDto rejectRefund(Long refundId, ProcessRefundRequestDto req) {
        ReturnRequest rr = loadAndValidateTransition(refundId, ReturnStatus.REJECTED);

        // [PATCH] Chỉ được reject refund thuộc chi nhánh mình
        assertStaffCanProcessRefund(rr, req.getProcessedById());

        ReturnStatus old = rr.getStatus();
        rr.setStatus(ReturnStatus.REJECTED);
        rr.setStaffNote(req.getNote());
        rr.setProcessedAt(LocalDateTime.now());
        setStaffRef(rr, req.getProcessedById());

        refundRepository.save(rr);
        saveAudit(rr, old, ReturnStatus.REJECTED, req.getProcessedById(), req.getNote());

        return toDetailDto(rr);
    }

    // ─── COMPLETE ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public RefundDetailDto completeRefund(Long refundId, CompleteRefundRequestDto req) {
        ReturnRequest rr = loadAndValidateTransition(refundId, ReturnStatus.REFUNDED);

        // [PATCH] Chỉ được complete refund thuộc chi nhánh mình
        assertStaffCanProcessRefund(rr, req.getProcessedById());

        ReturnStatus old = rr.getStatus();
        rr.setStatus(ReturnStatus.REFUNDED);
        rr.setTransactionRef(req.getTransactionRef());
        rr.setRefundMethod(req.getMethod());
        rr.setProcessedAt(LocalDateTime.now());
        setStaffRef(rr, req.getProcessedById());

        refundRepository.save(rr);
        saveAudit(rr, old, ReturnStatus.REFUNDED, req.getProcessedById(),
                "Hoàn tiền qua " + req.getMethod() + " — ref: " + req.getTransactionRef());

        paymentRepository.updateStatusByOrderId(
                rr.getOrder().getId(), PaymentStatus.REFUNDED);

        Order order = rr.getOrder();
        if (order.getStatus() != OrderStatus.REFUNDED) {
            order.setStatus(OrderStatus.REFUNDED);
            orderRepository.save(order);
        }

        return toDetailDto(rr);
    }

    // ─── STATS ───────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public RefundStatsDto getStats(LocalDateTime from, LocalDateTime to, Long storeId) {
        List<Object[]> rows = refundRepository.statsByStatus(from, to, storeId);

        Map<String, Long> countsByStatus = new LinkedHashMap<>();
        BigDecimal totalRequested = BigDecimal.ZERO;
        BigDecimal totalRefunded  = BigDecimal.ZERO;
        long total = 0;

        for (Object[] row : rows) {
            String statusName = (String) row[0];
            long   count      = ((Number) row[1]).longValue();
            BigDecimal amt    = row[2] != null
                    ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;

            try {
                String key = toFrontend(ReturnStatus.valueOf(statusName));
                countsByStatus.put(key, count);
                if (ReturnStatus.valueOf(statusName) == ReturnStatus.REFUNDED) {
                    totalRefunded = totalRefunded.add(amt);
                }
            } catch (IllegalArgumentException ignored) {
                countsByStatus.put(statusName.toLowerCase(), count);
            }

            totalRequested = totalRequested.add(amt);
            total += count;
        }

        return new RefundStatsDto(total, countsByStatus, totalRequested, totalRefunded);
    }

    // ─── EXPORT ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public byte[] exportRefunds(ExportRequestDto req) {
        String dbStatus = parseDbStatus(req.getStatus());
        List<ReturnRequest> list = refundRepository.findForExport(
                blankToNull(req.getQ()), dbStatus, req.getStoreId(),
                req.getFromDate(), req.getToDate());

        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.createSheet("Refunds");
            String[] headers = {"ID", "Mã đơn", "Khách hàng", "Chi nhánh",
                    "Số tiền", "Lý do", "Trạng thái",
                    "Ngày yêu cầu", "Ngày xử lý", "Xử lý bởi",
                    "Phương thức hoàn", "Mã giao dịch"};

            CellStyle headerStyle = buildHeaderStyle(wb);
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell c = hRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
            }

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            for (int i = 0; i < list.size(); i++) {
                ReturnRequest r = list.get(i);
                Row row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(r.getId());
                row.createCell(1).setCellValue(r.getOrder() != null ? r.getOrder().getOrderCode() : "");
                row.createCell(2).setCellValue(r.getUser() != null ? r.getUser().getFullName() : "");
                row.createCell(3).setCellValue(r.getOrder() != null && r.getOrder().getStore() != null
                        ? r.getOrder().getStore().getName() : "");
                row.createCell(4).setCellValue(r.getRefundAmount() != null
                        ? r.getRefundAmount().doubleValue() : 0);
                row.createCell(5).setCellValue(r.getReason());
                row.createCell(6).setCellValue(toFrontend(r.getStatus()));
                row.createCell(7).setCellValue(r.getRequestedAt() != null
                        ? r.getRequestedAt().format(dtf) : "");
                row.createCell(8).setCellValue(r.getProcessedAt() != null
                        ? r.getProcessedAt().format(dtf) : "");
                row.createCell(9).setCellValue(r.getStaff() != null
                        ? r.getStaff().getFullName() : "");
                row.createCell(10).setCellValue(r.getRefundMethod() != null
                        ? r.getRefundMethod() : "");
                row.createCell(11).setCellValue(r.getTransactionRef() != null
                        ? r.getTransactionRef() : "");
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi xuất file XLSX: " + e.getMessage(), e);
        }
    }

    // ─── PRIVATE HELPERS ─────────────────────────────────────────────────────

    /**
     * [PATCH] Kiểm tra staff có quyền xử lý refund này không.
     * Refund gắn với order → order gắn với store → so với store của staff.
     */
    private void assertStaffCanProcessRefund(ReturnRequest rr, Long staffId) {
        if (rr.getOrder() != null && rr.getOrder().getStore() != null) {
            storeAccessGuard.assertCanAccessStore(staffId, rr.getOrder().getStore().getId());
        }
    }

    private ReturnRequest loadAndValidateTransition(Long refundId, ReturnStatus target) {
        ReturnRequest rr = refundRepository.findById(refundId)
                .orElseThrow(() -> notFound(refundId));

        Set<ReturnStatus> allowed = VALID_TRANSITIONS.getOrDefault(rr.getStatus(), Set.of());
        if (!allowed.contains(target)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    String.format("Không thể chuyển trạng thái từ %s sang %s",
                            toFrontend(rr.getStatus()), toFrontend(target)));
        }
        return rr;
    }

    private void saveAudit(ReturnRequest rr, ReturnStatus oldStatus,
                           ReturnStatus newStatus, Long staffId, String note) {
        RefundAudit audit = new RefundAudit();
        audit.setReturnRequest(rr);
        audit.setOldStatus(oldStatus);
        audit.setNewStatus(newStatus);
        audit.setNote(note);
        if (staffId != null) {
            com.laptopshop.domain.store.entity.Staff ref =
                    new com.laptopshop.domain.store.entity.Staff();
            ref.setId(staffId);
            audit.setStaff(ref);
        }
        auditRepository.save(audit);
    }

    private void setStaffRef(ReturnRequest rr, Long staffId) {
        if (staffId == null) return;
        com.laptopshop.domain.store.entity.Staff ref =
                new com.laptopshop.domain.store.entity.Staff();
        ref.setId(staffId);
        rr.setStaff(ref);
    }

    private RefundListDto toListDto(ReturnRequest r) {
        return new RefundListDto(
                r.getId(),
                r.getOrder() != null ? r.getOrder().getOrderCode() : null,
                r.getUser()  != null ? r.getUser().getFullName()   : null,
                r.getOrder() != null && r.getOrder().getStore() != null
                        ? r.getOrder().getStore().getName() : null,
                r.getRefundAmount() != null ? r.getRefundAmount() : java.math.BigDecimal.ZERO,
                toFrontend(r.getStatus()),
                r.getRequestedAt()
        );
    }

    private RefundDetailDto toDetailDto(ReturnRequest r) {
        List<String> products = List.of();
        if (r.getItems() != null) {
            products = r.getItems().stream()
                    .filter(i -> i.getOrderItem() != null
                            && i.getOrderItem().getProduct() != null)
                    .map(i -> i.getOrderItem().getProduct().getName())
                    .collect(Collectors.toList());
        }

        String processedBy = r.getStaff() != null ? r.getStaff().getFullName() : null;

        return new RefundDetailDto(
                r.getId(),
                r.getOrder() != null ? r.getOrder().getOrderCode() : null,
                r.getUser() != null ? r.getUser().getFullName() : null,
                r.getOrder() != null && r.getOrder().getStore() != null
                        ? r.getOrder().getStore().getName() : null,
                r.getRefundAmount() != null ? r.getRefundAmount() : java.math.BigDecimal.ZERO,
                products,
                r.getReason(),
                toFrontend(r.getStatus()),
                r.getRequestedAt(),
                r.getProcessedAt(),
                processedBy,
                r.getStaffNote(),
                r.getTransactionRef(),
                r.getRefundMethod()
        );
    }

    private String parseDbStatus(String frontendStatus) {
        if (frontendStatus == null || frontendStatus.isBlank()) return null;
        return fromFrontend(frontendStatus).name();
    }

    private ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Không tìm thấy refund #" + id);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private CellStyle buildHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }
}
