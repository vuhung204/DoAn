package com.laptopshop.application.customer.cart.service;

import com.laptopshop.application.customer.cart.dto.CreateOrderRequest;
import com.laptopshop.application.customer.cart.dto.OrderItemResponse;
import com.laptopshop.application.customer.cart.dto.OrderResponse;
import com.laptopshop.application.customer.notification.service.NotificationService;
import com.laptopshop.domain.order.entity.*;
import com.laptopshop.domain.order.enums.OrderStatus;
import com.laptopshop.domain.order.enums.PaymentMethod;
import com.laptopshop.domain.order.enums.PaymentStatus;
import com.laptopshop.domain.order.repository.AddressRepository;
import com.laptopshop.domain.order.repository.CartItemRepository;
import com.laptopshop.domain.order.repository.OrderItemRepository;
import com.laptopshop.domain.order.repository.OrderRepository;
import com.laptopshop.domain.refund.repository.ReturnRequestRepository;
import com.laptopshop.domain.review.repository.ReviewRepository;
import com.laptopshop.domain.store.entity.Store;
import com.laptopshop.domain.store.repository.StoreRepository;
import com.laptopshop.domain.user.entity.User;
import com.laptopshop.domain.user.repository.UserRepository;
import com.laptopshop.domain.warranty.entity.WarrantyRequest;
import com.laptopshop.domain.warranty.repository.WarrantyRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final ReviewRepository         reviewRepository;
    private final OrderRepository          orderRepository;
    private final CartItemRepository       cartItemRepository;
    private final AddressRepository        addressRepository;
    private final UserRepository           userRepository;
    private final StoreRepository          storeRepository;
    private final OrderItemRepository      orderItemRepository;
    private final NotificationService      notificationService;
    private final WarrantyRequestRepository warrantyRequestRepository;
    private final ReturnRequestRepository  returnRequestRepository;

    private static final BigDecimal FREE_SHIP_THRESHOLD  = new BigDecimal("10000000");
    private static final BigDecimal DEFAULT_SHIPPING_FEE = new BigDecimal("200000");

    // ── Create order ──────────────────────────────────────────────────────────

    @Transactional
    public OrderResponse createOrder(Long userId, CreateOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        Address address = addressRepository.findByIdAndUserId(request.getAddressId(), userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy địa chỉ"));

        List<CartItem> cartItems = cartItemRepository.findAllByUserId(userId);
        if (cartItems.isEmpty()) throw new RuntimeException("Giỏ hàng trống");

        // Build order items
        List<OrderItem> orderItems = cartItems.stream().map(cartItem -> {
            OrderItem item = new OrderItem();
            item.setProduct(cartItem.getProduct());
            item.setQuantity(cartItem.getQuantity());
            BigDecimal price = cartItem.getProduct().getSalePrice() != null
                    ? cartItem.getProduct().getSalePrice()
                    : cartItem.getProduct().getBasePrice();
            item.setUnitPrice(price);
            item.setTotalPrice(price.multiply(BigDecimal.valueOf(cartItem.getQuantity())));
            return item;
        }).collect(Collectors.toList());

        BigDecimal subtotal = orderItems.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal shippingFee = subtotal.compareTo(FREE_SHIP_THRESHOLD) >= 0
                ? BigDecimal.ZERO
                : DEFAULT_SHIPPING_FEE;

        BigDecimal discountAmount = BigDecimal.ZERO;
        Promotion promotion = null;
        if (request.getPromotionId() != null) {
            promotion = new Promotion();
            promotion.setId(request.getPromotionId());
        }

        BigDecimal totalAmount = subtotal.subtract(discountAmount).add(shippingFee);

        Store defaultStore = storeRepository.findFirstByIsActiveTrueOrderByIdAsc()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cửa hàng đang hoạt động"));

        Order order = new Order();
        order.setUser(user);
        order.setStore(defaultStore);
        order.setAddress(address);
        order.setPromotion(promotion);
        order.setOrderCode(generateOrderCode());
        order.setStatus(OrderStatus.PENDING);
        order.setSubtotal(subtotal);
        order.setDiscountAmount(discountAmount);
        order.setShippingFee(shippingFee);
        order.setTotalAmount(totalAmount);
        order.setNote(request.getNote());

        orderItems.forEach(item -> item.setOrder(order));
        order.setItems(orderItems);

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setMethod(PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase()));
        payment.setStatus(PaymentStatus.PENDING);
        payment.setAmount(totalAmount);
        order.setPayment(payment);

        orderRepository.save(order);
        cartItemRepository.deleteAllByUserId(userId);

        return OrderResponse.from(order);
    }

    // ── Get orders list ───────────────────────────────────────────────────────

    public List<OrderResponse> getOrders(Long userId) {
        return orderRepository.findAllByUserIdOrderByOrderedAtDesc(userId)
                .stream()
                .map(OrderResponse::from)
                .collect(Collectors.toList());
    }

    // ── Get order detail ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OrderResponse getOrderDetail(Long userId, Long orderId) {
        Order order = orderRepository.findDetailById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Không có quyền xem đơn hàng này");
        }

        List<OrderItem> items = orderItemRepository.findByOrderIdWithProductDetails(orderId);

        List<Long> reviewedItemIds = reviewRepository.findReviewedOrderItemIds(userId, orderId);
        Set<Long>  reviewedSet     = new HashSet<>(reviewedItemIds);

        Set<Long> warrantyItemIds = new HashSet<>(
                warrantyRequestRepository.findOrderItemIdsByUserId(userId, orderId));
        Set<Long> refundedItemIds = new HashSet<>(
                returnRequestRepository.findOrderItemIdsByUserId(userId, orderId));

        List<OrderItemResponse> itemDtos = items.stream()
                .map(item -> OrderItemResponse.from(
                        item,
                        reviewedSet.contains(item.getId()),
                        warrantyItemIds.contains(item.getId()),
                        refundedItemIds.contains(item.getId())
                ))
                .collect(Collectors.toList());

        return OrderResponse.fromWithItems(order, itemDtos);
    }

    // ── Cancel order ──────────────────────────────────────────────────────────

    @Transactional
    public OrderResponse cancelOrder(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (!order.getStatus().canTransitionTo(OrderStatus.CANCELLED)) {
            throw new RuntimeException(
                    "Không thể huỷ đơn hàng ở trạng thái: " + order.getStatus().toFrontend());
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order saved = orderRepository.save(order);

        // Thông báo cho user khi tự huỷ đơn
        notificationService.pushOrderStatus(
                saved.getUser().getId(),
                saved.getOrderCode(),
                saved.getId(),
                "CANCELLED"
        );

        return OrderResponse.from(saved);
    }

    // ── Update order status (dùng cho staff / admin) ──────────────────────────

    /**
     * Staff đổi trạng thái đơn hàng.
     * Gọi method này từ AdminOrderController / StaffOrderController.
     */
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + orderId));

        if (!order.getStatus().canTransitionTo(newStatus)) {
            throw new RuntimeException(
                    "Không thể chuyển từ " + order.getStatus() + " sang " + newStatus);
        }

        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);

        // Push notification cho khách hàng
        notificationService.pushOrderStatus(
                saved.getUser().getId(),
                saved.getOrderCode(),
                saved.getId(),
                newStatus.name()
        );

        return OrderResponse.from(saved);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String generateOrderCode() {
        String date   = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.valueOf((int) (Math.random() * 9000) + 1000);
        return "ORD-" + date + "-" + random;
    }
}