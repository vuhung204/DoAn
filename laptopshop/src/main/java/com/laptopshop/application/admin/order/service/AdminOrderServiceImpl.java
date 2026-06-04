package com.laptopshop.application.admin.order.service;

import com.laptopshop.application.admin.order.dto.*;
import com.laptopshop.application.customer.notification.service.NotificationService;
import com.laptopshop.domain.catalog.entity.Product;
import com.laptopshop.domain.catalog.repository.ProductRepository;
import com.laptopshop.domain.inventory.entity.InventoryTransaction;
import com.laptopshop.domain.inventory.enums.InventoryTransactionType;
import com.laptopshop.domain.inventory.repository.InventoryTransactionRepository;
import com.laptopshop.domain.inventory.repository.StoreInventoryRepository;
import com.laptopshop.domain.order.entity.*;
import com.laptopshop.domain.order.enums.OrderStatus;
import com.laptopshop.domain.order.enums.PaymentMethod;
import com.laptopshop.domain.order.enums.PaymentStatus;
import com.laptopshop.domain.order.enums.ShipmentStatus;
import com.laptopshop.domain.order.repository.*;
import com.laptopshop.domain.store.entity.Staff;
import com.laptopshop.domain.store.entity.Store;
import com.laptopshop.domain.store.repository.StoreRepository;
import com.laptopshop.domain.refund.entity.ReturnRequest;
import com.laptopshop.domain.refund.enums.ReturnStatus;
import com.laptopshop.domain.refund.repository.RefundRepository;
import com.laptopshop.domain.user.entity.User;
import com.laptopshop.domain.user.enums.UserStatus;
import com.laptopshop.domain.user.repository.UserRepository;
import com.laptopshop.infrastructure.security.StoreAccessGuard;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminOrderServiceImpl implements AdminOrderService {

    private final OrderRepository                orderRepository;
    private final OrderItemRepository            orderItemRepository;
    private final OrderHistoryRepository         orderHistoryRepository;
    private final ShipmentRepository             shipmentRepository;
    private final RefundRepository               refundRepository;
    private final StoreInventoryRepository       storeInventoryRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final StoreRepository                storeRepository;
    private final ProductRepository              productRepository;
    private final UserRepository                 userRepository;
    private final NotificationService            notificationService;
    private final StoreAccessGuard storeAccessGuard;

    private static final DateTimeFormatter OUT_DTF =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    // ── SEARCH ────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageDto<OrderListDto> searchOrders(String q, String status, Long storeId,
                                              LocalDateTime from, LocalDateTime to,
                                              Pageable pageable) {
        String dbStatus = (status != null && !status.isBlank())
                ? OrderStatus.fromFrontend(status).name()
                : null;
        Page<Order> page = orderRepository.searchOrders(
                blankToNull(q), dbStatus, storeId, from, to, pageable);
        return PageDto.of(page.map(this::toOrderListDtoNew));
    }

    // ── DETAIL ────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public OrderDetailDto getOrderDetail(Long orderId) {
        Order order = orderRepository.findDetailById(orderId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Không tìm thấy đơn hàng #" + orderId));
        List<OrderItem>   items   = orderItemRepository.findByOrderIdWithProduct(orderId);
        List<OrderHistory> history = orderHistoryRepository
                .findByOrderIdOrderByCreatedAtAsc(orderId);
        return toOrderDetailDtoNew(order, items, history);
    }

    // ── UPDATE STATUS ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void updateOrderStatus(Long orderId,
                                  UpdateOrderStatusRequestDto req,
                                  Long staffId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Không tìm thấy đơn hàng #" + orderId));

        if (order.getStore() != null) {
            storeAccessGuard.assertCanAccessStore(staffId, order.getStore().getId());
        }

        OrderStatus currentStatus = order.getStatus();
        OrderStatus newStatus     = OrderStatus.fromFrontend(req.getStatus());

        if (!currentStatus.canTransitionTo(newStatus)) {
            throw new IllegalStateException(String.format(
                    "Không thể chuyển trạng thái từ %s sang %s",
                    currentStatus.toFrontend(), newStatus.toFrontend()));
        }

        if (newStatus == OrderStatus.CONFIRMED) {
            if (req.getStoreId() == null) {
                throw new IllegalArgumentException(
                        "Vui lòng chọn chi nhánh xử lý khi xác nhận đơn hàng");
            }
            Store store = storeRepository.findById(req.getStoreId())
                    .filter(s -> Boolean.TRUE.equals(s.getIsActive()))
                    .orElseThrow(() -> new NoSuchElementException(
                            "Chi nhánh không tồn tại hoặc đã ngừng hoạt động: "
                                    + req.getStoreId()));
            storeAccessGuard.assertCanAccessStore(staffId, req.getStoreId());
            order.setStore(store);
        }

        if (newStatus == OrderStatus.SHIPPING) {
            adjustInventoryForOrder(order, -1);
        } else if (newStatus == OrderStatus.CANCELLED
                && currentStatus == OrderStatus.SHIPPING) {
            adjustInventoryForOrder(order, +1);
        }

        OrderHistory history = new OrderHistory();
        history.setOrder(order);
        history.setOldStatus(currentStatus);
        history.setNewStatus(newStatus);
        history.setStaffNote(req.getStaffNote());
        if (staffId != null) {
            Staff staffRef = new Staff();
            staffRef.setId(staffId);
            history.setStaff(staffRef);
        }
        orderHistoryRepository.save(history);

        order.setStatus(newStatus);
        orderRepository.save(order);

        try {
            if (order.getUser() != null) {
                notificationService.pushOrderStatus(
                        order.getUser().getId(),
                        order.getOrderCode(),
                        order.getId(),
                        newStatus.toFrontend()
                );
            }
        } catch (Exception e) {

        }
    }

    // ── ORDER ITEMS ───────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageDto<OrderItemDto> getOrderItems(Long orderId, Pageable pageable) {
        if (!orderRepository.existsById(orderId)) {
            throw new NoSuchElementException("Không tìm thấy đơn hàng #" + orderId);
        }
        Page<OrderItem> page = orderItemRepository.findPageByOrderId(orderId, pageable);
        return PageDto.of(page.map(this::toOrderItemDto));
    }

    // ── REFUND ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public RefundDto createRefund(Long orderId, RefundRequestDto req, Long staffId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Không tìm thấy đơn hàng #" + orderId));

        if (order.getStore() != null) {
            storeAccessGuard.assertCanAccessStore(staffId, order.getStore().getId());
        }

        if (order.getStatus() != OrderStatus.COMPLETED
                && order.getStatus() != OrderStatus.CANCELLED) {
            throw new IllegalStateException(
                    "Chỉ có thể hoàn tiền đơn đã hoàn thành hoặc đã huỷ");
        }

        BigDecimal alreadyRefunded = refundRepository
                .sumRefundedAmount(orderId, ReturnStatus.APPROVED);
        BigDecimal remaining = order.getTotalAmount().subtract(alreadyRefunded);
        if (req.getAmount().compareTo(remaining) > 0) {
            throw new IllegalArgumentException(String.format(
                    "Số tiền hoàn (%s) vượt quá số tiền còn lại có thể hoàn (%s)",
                    req.getAmount().toPlainString(), remaining.toPlainString()));
        }

        ReturnRequest returnRequest = new ReturnRequest();
        returnRequest.setOrder(order);
        returnRequest.setUser(order.getUser());
        returnRequest.setReason(req.getReason());
        returnRequest.setRefundAmount(req.getAmount());
        returnRequest.setStatus(ReturnStatus.PENDING);
        ReturnRequest saved = refundRepository.save(returnRequest);

        if (req.getAmount().compareTo(order.getTotalAmount()) == 0) {
            order.setStatus(OrderStatus.REFUNDED);
            orderRepository.save(order);
        }

        return new RefundDto(saved.getId(), orderId, saved.getRefundAmount(),
                saved.getStatus().name(), saved.getReason(), saved.getRequestedAt());
    }

    // ── SHIP ──────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void shipOrder(Long orderId, ShipRequestDto req, Long staffId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Không tìm thấy đơn hàng #" + orderId));

        if (order.getStore() != null) {
            storeAccessGuard.assertCanAccessStore(staffId, order.getStore().getId());
        }

        if (shipmentRepository.existsByOrderId(orderId)) {
            throw new IllegalStateException(
                    "Đơn hàng #" + orderId + " đã có thông tin vận chuyển");
        }

        Shipment shipment = new Shipment();
        shipment.setOrder(order);
        shipment.setCarrier(req.getCarrier());
        shipment.setTrackingCode(req.getTrackingNumber());
        shipment.setShippedAt(req.getShippedAt() != null
                ? req.getShippedAt() : LocalDateTime.now());
        shipment.setStatus(ShipmentStatus.IN_TRANSIT);
        shipmentRepository.save(shipment);

        internalUpdateStatus(order, OrderStatus.SHIPPING, staffId,
                "Bàn giao cho " + req.getCarrier());
    }

    // ── EXPORT ────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public byte[] exportOrders(ExportRequestDto req) {
        String dbStatus = (req.getStatus() != null && !req.getStatus().isBlank())
                ? OrderStatus.fromFrontend(req.getStatus()).name()
                : null;

        List<Order> orders = orderRepository.findOrderForExport(
                blankToNull(req.getQ()), dbStatus, req.getStoreId(),
                req.getFromDate(), req.getToDate());

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Orders");
            String[] headers = {"Mã đơn", "Khách hàng", "Chi nhánh",
                    "Tổng tiền", "Số lượng SP", "Thanh toán", "Trạng thái", "Ngày đặt"};
            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = buildHeaderStyle(workbook);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            for (int i = 0; i < orders.size(); i++) {
                Order o   = orders.get(i);
                Row   row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(o.getOrderCode());
                row.createCell(1).setCellValue(
                        o.getUser() != null ? o.getUser().getFullName() : "");
                row.createCell(2).setCellValue(
                        o.getStore() != null ? o.getStore().getName() : "");
                row.createCell(3).setCellValue(
                        o.getTotalAmount() != null ? o.getTotalAmount().doubleValue() : 0.0);
                row.createCell(4).setCellValue(
                        o.getItems() != null ? o.getItems().size() : 0);
                row.createCell(5).setCellValue(
                        o.getPayment() != null ? o.getPayment().getMethod().name() : "");
                row.createCell(6).setCellValue(o.getStatus().toFrontend());
                row.createCell(7).setCellValue(
                        o.getOrderedAt() != null ? o.getOrderedAt().format(dtf) : "");
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            workbook.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi xuất file XLSX: " + e.getMessage(), e);
        }
    }

    // ── STATS ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public OrdersStatsDto getStats(LocalDateTime from, LocalDateTime to, Long storeId) {
        List<Object[]> rows = orderRepository.aggregateOrderStats(from, to, storeId);

        long totalOrders = 0L;
        BigDecimal totalRevenue = BigDecimal.ZERO;
        long pending = 0, confirmed = 0, processing = 0,
                shipping = 0, done = 0, cancelled = 0, refunded = 0;

        for (Object[] row : rows) {
            String     statusName = (String) row[0];
            long       count      = ((Number) row[1]).longValue();
            BigDecimal rev        = row[2] != null
                    ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;

            totalOrders += count;
            totalRevenue = totalRevenue.add(rev);

            try {
                String key = OrderStatus.valueOf(statusName).toFrontend();
                switch (key) {
                    case "pending"    -> pending    = count;
                    case "confirmed"  -> confirmed  = count;
                    case "processing" -> processing = count;
                    case "shipping"   -> shipping   = count;
                    case "done"       -> done       = count;
                    case "cancelled"  -> cancelled  = count;
                    case "refunded"   -> refunded   = count;
                    default           -> { /* ignore */ }
                }
            } catch (IllegalArgumentException ignored) { }
        }

        return new OrdersStatsDto(totalOrders, pending, confirmed, processing,
                shipping, done, cancelled, refunded, totalRevenue);
    }

    // ── CREATE ORDER BY STAFF ─────────────────────────────────────────────────

    @Override
    @Transactional
    public AdminCreateOrderResult createOrderByStaff(
            AdminCreateOrderRequest request, Long staffId) {

        Store store = storeRepository.findById(request.getStoreId())
                .filter(s -> Boolean.TRUE.equals(s.getIsActive()))
                .orElseThrow(() -> new NoSuchElementException(
                        "Chi nhánh không tồn tại hoặc đã ngừng hoạt động: "
                                + request.getStoreId()));

        storeAccessGuard.assertCanAccessStore(staffId, request.getStoreId());

        User user;
        String customerType, customerName, customerPhone;

        if (request.getUserId() != null) {
            user          = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new NoSuchElementException(
                            "Không tìm thấy khách hàng ID=" + request.getUserId()));
            customerType  = "registered";
            customerName  = user.getFullName();
            customerPhone = user.getPhone();
        } else {
            AdminCreateOrderRequest.WalkInCustomerDto w = request.getWalkInCustomer();
            if (w == null) throw new IllegalArgumentException(
                    "Phải cung cấp thông tin khách hàng (userId hoặc walkInCustomer)");

            if (w.getEmail() != null && !w.getEmail().isBlank()) {
                user = userRepository.findByEmail(w.getEmail()).orElseGet(() -> {
                    User u = new User();
                    u.setFullName(w.getName()); u.setPhone(w.getPhone());
                    u.setEmail(w.getEmail());   u.setPasswordHash("");
                    u.setStatus(UserStatus.UNVERIFIED);
                    return userRepository.save(u);
                });
            } else {
                User u = new User();
                u.setFullName(w.getName()); u.setPhone(w.getPhone());
                u.setEmail("walkin_" + w.getPhone() + "_"
                        + System.currentTimeMillis() + "@local");
                u.setPasswordHash(""); u.setStatus(UserStatus.UNVERIFIED);
                user = userRepository.save(u);
            }
            customerType  = "walk_in";
            customerName  = w.getName();
            customerPhone = w.getPhone();
        }

        List<OrderItem> orderItems = new ArrayList<>();
        for (AdminCreateOrderRequest.OrderLineRequest line : request.getItems()) {
            Product product = productRepository.findById(line.getProductId())
                    .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                    .orElseThrow(() -> new NoSuchElementException(
                            "Sản phẩm không tồn tại hoặc đã ngừng bán: "
                                    + line.getProductId()));
            BigDecimal price = product.getSalePrice() != null
                    ? product.getSalePrice() : product.getBasePrice();
            OrderItem item = new OrderItem();
            item.setProduct(product);
            item.setQuantity(line.getQuantity());
            item.setUnitPrice(price);
            item.setTotalPrice(price.multiply(BigDecimal.valueOf(line.getQuantity())));
            orderItems.add(item);
        }

        BigDecimal subtotal = orderItems.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal shippingFee    = BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal totalAmount    = subtotal.subtract(discountAmount).add(shippingFee);

        Order order = new Order();
        order.setUser(user);         order.setStore(store);
        order.setAddress(null);      order.setOrderCode(generateOrderCode());
        order.setStatus(OrderStatus.CONFIRMED);
        order.setSubtotal(subtotal); order.setDiscountAmount(discountAmount);
        order.setShippingFee(shippingFee); order.setTotalAmount(totalAmount);
        order.setNote(request.getNote());
        orderItems.forEach(item -> item.setOrder(order));
        order.setItems(orderItems);

        Payment payment = new Payment();
        payment.setOrder(order);
        try {
            payment.setMethod(PaymentMethod.valueOf(
                    request.getPaymentMethod().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Phương thức thanh toán không hợp lệ: " + request.getPaymentMethod());
        }
        boolean isPaidNow = "COD".equalsIgnoreCase(request.getPaymentMethod())
                || "CASH".equalsIgnoreCase(request.getPaymentMethod());
        payment.setStatus(isPaidNow ? PaymentStatus.PAID : PaymentStatus.PENDING);
        payment.setAmount(totalAmount);
        if (isPaidNow) payment.setPaidAt(LocalDateTime.now());
        order.setPayment(payment);

        orderRepository.save(order);

        OrderHistory history = new OrderHistory();
        history.setOrder(order); history.setOldStatus(null);
        history.setNewStatus(OrderStatus.CONFIRMED);
        history.setStaffNote("Đơn tạo tại quầy bởi nhân viên");
        if (staffId != null) {
            Staff staffRef = new Staff(); staffRef.setId(staffId);
            history.setStaff(staffRef);
        }
        orderHistoryRepository.save(history);

        String orderedAtStr = order.getOrderedAt() != null
                ? order.getOrderedAt().format(OUT_DTF) : "";

        return new AdminCreateOrderResult(
                order.getId(), order.getOrderCode(), customerType,
                customerName, customerPhone, store.getName(),
                subtotal, discountAmount, shippingFee, totalAmount,
                payment.getMethod().name(), order.getStatus().toFrontend(),
                order.getNote(), orderedAtStr);
    }

    // ── PRIVATE HELPERS ───────────────────────────────────────────────────────

    private OrderListDto toOrderListDtoNew(Order o) {
        int itemCount = o.getItems() != null ? o.getItems().size()
                : orderItemRepository.countByOrderId(o.getId());
        String payMethod = o.getPayment() != null
                ? o.getPayment().getMethod().name() : null;
        String payStatus = o.getPayment() != null
                ? o.getPayment().getStatus().name() : null;
        String orderedAt = o.getOrderedAt() != null
                ? o.getOrderedAt().format(OUT_DTF) : "";
        return new OrderListDto(
                o.getId(), o.getOrderCode(),
                o.getUser()  != null ? o.getUser().getFullName() : null,
                o.getUser()  != null ? o.getUser().getPhone()    : null,
                o.getUser()  != null ? o.getUser().getEmail()    : null,
                o.getStore() != null ? o.getStore().getName()    : null,
                o.getTotalAmount(), itemCount, payMethod, payStatus,
                o.getStatus().toFrontend(), orderedAt);
    }

    private OrderDetailDto toOrderDetailDtoNew(Order o,
                                               List<OrderItem> items,
                                               List<OrderHistory> history) {
        CustomerDto customer = o.getUser() != null
                ? new CustomerDto(o.getUser().getFullName(),
                o.getUser().getPhone(), o.getUser().getEmail()) : null;

        AddressDto address = null;
        if (o.getAddress() != null) {
            Address a = o.getAddress();
            address = new AddressDto(a.getRecipientName(), a.getPhone(),
                    a.getAddressLine(), a.getWard(), a.getDistrict(), a.getCity());
        }

        String payMethod = o.getPayment() != null
                ? o.getPayment().getMethod().name() : null;
        String payStatus = o.getPayment() != null
                ? o.getPayment().getStatus().name() : null;
        String orderedAt = o.getOrderedAt() != null
                ? o.getOrderedAt().format(OUT_DTF) : "";

        return new OrderDetailDto(
                o.getId(), o.getOrderCode(),
                o.getUser() != null ? o.getUser().getId() : null,
                customer, address,
                o.getStore() != null ? o.getStore().getName() : null,
                payMethod, payStatus, o.getStatus().toFrontend(),
                o.getSubtotal(), o.getDiscountAmount(),
                o.getShippingFee(), o.getTotalAmount(),
                o.getNote(), orderedAt,
                items.stream().map(this::toOrderItemDto).collect(Collectors.toList()),
                history.stream().map(this::toOrderHistoryDtoNew).collect(Collectors.toList()));
    }

    private OrderHistoryDto toOrderHistoryDtoNew(OrderHistory h) {
        boolean done = h.getNewStatus() == OrderStatus.COMPLETED
                || h.getNewStatus() == OrderStatus.CANCELLED
                || h.getNewStatus() == OrderStatus.REFUNDED;
        String time = h.getCreatedAt() != null ? h.getCreatedAt().format(OUT_DTF) : "";
        return new OrderHistoryDto(statusLabel(h.getNewStatus()), time,
                h.getStaff() != null ? h.getStaff().getFullName() : null,
                h.getStaffNote(), done);
    }

    private OrderItemDto toOrderItemDto(OrderItem oi) {
        return new OrderItemDto(oi.getId(), oi.getProduct().getId(),
                oi.getProduct().getSku(), oi.getProduct().getName(),
                oi.getQuantity(), oi.getUnitPrice(), oi.getTotalPrice());
    }

    private String statusLabel(OrderStatus status) {
        return switch (status) {
            case PENDING    -> "Chờ xác nhận";
            case CONFIRMED  -> "Đã xác nhận";
            case PROCESSING -> "Đang xử lý";
            case SHIPPING   -> "Đang giao hàng";
            case COMPLETED  -> "Giao hàng thành công";
            case CANCELLED  -> "Đã huỷ";
            case REFUNDED   -> "Đã hoàn tiền";
        };
    }

    private void adjustInventoryForOrder(Order order, int direction) {
        if (order.getItems() == null) return;
        Long storeId = order.getStore().getId();
        for (OrderItem item : order.getItems()) {
            Long productId = item.getProduct().getId();
            int  delta     = item.getQuantity() * direction;

            int updated = storeInventoryRepository.adjustQuantity(storeId, productId, delta);
            if (updated == 0 && direction < 0) {
                throw new IllegalStateException(String.format(
                        "Tồn kho không đủ cho sản phẩm ID=%d tại chi nhánh ID=%d",
                        productId, storeId));
            }

            InventoryTransaction txn = new InventoryTransaction();
            txn.setQuantityDelta(delta);
            txn.setTransactionType(direction < 0
                    ? InventoryTransactionType.ORDER_DEDUCT
                    : InventoryTransactionType.RETURN_IN);
            txn.setNote(direction < 0
                    ? "Xuất kho theo đơn " + order.getOrderCode()
                    : "Hoàn kho do huỷ đơn " + order.getOrderCode());
            txn.setOrder(order);
            Store storeRef = new Store(); storeRef.setId(storeId); txn.setStore(storeRef);
            Product productRef = new Product(); productRef.setId(productId); txn.setProduct(productRef);
            inventoryTransactionRepository.save(txn);
        }
    }

    private void internalUpdateStatus(Order order, OrderStatus newStatus,
                                      Long staffId, String note) {
        OrderStatus currentStatus = order.getStatus();
        if (!currentStatus.canTransitionTo(newStatus)) {
            throw new IllegalStateException(String.format(
                    "Không thể chuyển trạng thái từ %s sang %s",
                    currentStatus, newStatus));
        }
        if (newStatus == OrderStatus.SHIPPING) adjustInventoryForOrder(order, -1);

        OrderHistory history = new OrderHistory();
        history.setOrder(order); history.setOldStatus(currentStatus);
        history.setNewStatus(newStatus); history.setStaffNote(note);
        if (staffId != null) {
            Staff staffRef = new Staff(); staffRef.setId(staffId);
            history.setStaff(staffRef);
        }
        orderHistoryRepository.save(history);
        order.setStatus(newStatus);
        orderRepository.save(order);

        try {
            if (order.getUser() != null) {
                notificationService.pushOrderStatus(
                        order.getUser().getId(),
                        order.getOrderCode(),
                        order.getId(),
                        newStatus.toFrontend()
                );
            }
        } catch (Exception e) {

        }
    }

    private CellStyle buildHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private String generateOrderCode() {
        String date   = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.valueOf((int)(Math.random() * 9000) + 1000);
        return "ORD-" + date + "-" + random;
    }
}
