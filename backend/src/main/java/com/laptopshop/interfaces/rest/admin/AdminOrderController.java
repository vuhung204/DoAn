package com.laptopshop.interfaces.rest.admin;

import com.laptopshop.application.admin.order.dto.*;
import com.laptopshop.application.admin.order.service.AdminOrderService;

import com.laptopshop.domain.order.repository.OrderRepository;
import com.laptopshop.domain.store.repository.StoreRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Admin REST API — Quản lý đơn hàng.
 * Base URL: /api/admin/orders
 */
@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final AdminOrderService orderService;
    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/admin/orders — danh sách đơn hàng có filter + phân trang
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<PageDto<OrderListDto>> searchOrders(
            @RequestParam(required = false)                     String q,
            @RequestParam(required = false)                     String status,
            @RequestParam(required = false)                     Long   storeId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0")                   int    page,
            @RequestParam(defaultValue = "20")                  int    size,
            @RequestParam(defaultValue = "orderedAt")           String sort,
            @RequestParam(defaultValue = "desc")                String dir
    ) {
        Sort.Direction direction = "asc".equalsIgnoreCase(dir)
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by(direction, sort));

        return ResponseEntity.ok(
                orderService.searchOrders(q, status, storeId, fromDate, toDate, pageable));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/admin/orders/stats — thống kê stat cards
    // Phải đặt TRƯỚC /{orderId} để tránh Spring nhầm "stats" là orderId
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<OrdersStatsDto> getStats(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) Long storeId
    ) {
        // Default: 30 ngày gần nhất
        LocalDateTime from = fromDate != null ? fromDate : LocalDateTime.now().minusDays(30);
        LocalDateTime to   = toDate   != null ? toDate   : LocalDateTime.now();

        return ResponseEntity.ok(orderService.getStats(from, to, storeId));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/admin/orders/export — xuất XLSX
    // Phải đặt TRƯỚC /{orderId}
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<byte[]> exportOrders(
            @RequestParam(defaultValue = "LIST")                String exportType,
            @RequestParam(required = false)                     String q,
            @RequestParam(required = false)                     String status,
            @RequestParam(required = false)                     Long   storeId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate
    ) {
        ExportRequestDto req = new ExportRequestDto();
        req.setExportType(exportType);
        req.setQ(q);
        req.setStatus(status);
        req.setStoreId(storeId);
        req.setFromDate(fromDate);
        req.setToDate(toDate);

        byte[] xlsx = orderService.exportOrders(req);

        String filename = "orders-"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"))
                + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(filename).build());

        return ResponseEntity.ok().headers(headers).body(xlsx);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/admin/orders/{orderRef} — chi tiết đơn hàng
    // orderRef có thể là numeric id hoặc orderCode (chuỗi)
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/{orderRef}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<OrderDetailDto> getOrderDetail(@PathVariable String orderRef) {
        Long orderId = resolveOrderId(orderRef);
        return ResponseEntity.ok(orderService.getOrderDetail(orderId));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATCH /api/admin/orders/{orderRef}/status — cập nhật trạng thái
    // ─────────────────────────────────────────────────────────────────────────
    @PatchMapping("/{orderRef}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<Void> updateOrderStatus(
            @PathVariable String orderRef,
            @Valid @RequestBody UpdateOrderStatusRequestDto req,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails principal
    ) {
        Long staffId = extractStaffId(principal);
        Long orderId = resolveOrderId(orderRef);
        // Thay đổi: UpdateOrderStatusRequestDto hiện dùng field 'status'
        orderService.updateOrderStatus(orderId,
                // cast to the interface's DTO package expected type (service signature uses admin dto)
                req, staffId);
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/admin/orders/{orderRef}/items — danh sách sản phẩm trong đơn
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/{orderRef}/items")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<PageDto<OrderItemDto>> getOrderItems(
            @PathVariable String orderRef,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Long orderId = resolveOrderId(orderRef);
        Pageable pageable = PageRequest.of(page, Math.min(size, 200));
        return ResponseEntity.ok(orderService.getOrderItems(orderId, pageable));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/admin/orders/{orderRef}/refund — tạo yêu cầu hoàn tiền
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/{orderRef}/refund")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<RefundDto> createRefund(
            @PathVariable String orderRef,
            @Valid @RequestBody RefundRequestDto req,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails principal
    ) {
        Long staffId = extractStaffId(principal);
        Long orderId = resolveOrderId(orderRef);
        return ResponseEntity.ok(orderService.createRefund(orderId, req, staffId));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/admin/orders/{orderRef}/ship — tạo shipment & chuyển trạng thái
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/{orderRef}/ship")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<Void> shipOrder(
            @PathVariable String orderRef,
            @Valid @RequestBody ShipRequestDto req,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails principal
    ) {
        Long staffId = extractStaffId(principal);
        Long orderId = resolveOrderId(orderRef);
        orderService.shipOrder(orderId, req, staffId);
        return ResponseEntity.noContent().build();
    }

    // ───────────────────────────────────────────────────────────────���─────────
    // HELPER: lấy staffId từ JWT principal
    // ─────────────────────────────────────────────────────────────────────────
    private Long extractStaffId(
            org.springframework.security.core.userdetails.UserDetails principal) {
        if (principal == null) return null;
        try {
            return Long.parseLong(principal.getUsername());
        } catch (NumberFormatException e) {
            return null; // username là email → staffId sẽ null, history ghi null
        }
    }

    // Resolve orderRef (string) -> numeric orderId.
    // Nếu orderRef là số => parse trực tiếp; ngược lại gọi findByOrderCode.
    private Long resolveOrderId(String orderRef) {
        if (orderRef == null || orderRef.isBlank()) {
            throw new IllegalArgumentException("orderRef không được rỗng");
        }
        try {
            return Long.parseLong(orderRef);
        } catch (NumberFormatException ignored) {
            return orderRepository.findByOrderCode(orderRef)
                    .orElseThrow(() -> new NoSuchElementException("Không tìm thấy đơn hàng: " + orderRef))
                    .getId();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/admin/orders — Admin tạo đơn hàng tại quầy
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<AdminCreateOrderResult> createOrderByStaff(
            @Valid @RequestBody AdminCreateOrderRequest request,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails principal
    ) {
        Long staffId = extractStaffId(principal);
        AdminCreateOrderResult result = orderService.createOrderByStaff(request, staffId);
        return ResponseEntity.status(201).body(result);
    }

    // GET /api/admin/orders/stores — danh sách chi nhánh active
    @GetMapping("/stores")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<List<StoreOptionDto>> getActiveStores() {
        List<StoreOptionDto> stores = storeRepository.findAllActive()
                .stream()
                .map(s -> new StoreOptionDto(s.getId(), s.getName()))
                .toList();
        return ResponseEntity.ok(stores);
    }
}
