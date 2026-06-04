package com.laptopshop.application.customer.user.service;

import com.laptopshop.application.customer.user.dto.AddressResponse;
import com.laptopshop.application.customer.user.dto.UserDashboardResponse;
import com.laptopshop.domain.catalog.entity.ProductImage;
import com.laptopshop.domain.order.entity.Order;
import com.laptopshop.domain.order.entity.Wishlist;
import com.laptopshop.domain.order.enums.OrderStatus;
import com.laptopshop.domain.order.repository.OrderRepository;
import com.laptopshop.domain.order.repository.WishlistRepository;
import com.laptopshop.domain.user.entity.User;
import com.laptopshop.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDashboardService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final int RECENT_ORDERS_LIMIT = 5;

    private final UserRepository     userRepository;
    private final OrderRepository    orderRepository;
    private final WishlistRepository wishlistRepository;

    @Transactional(readOnly = true)
    public UserDashboardResponse getDashboard(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        // ── 1. Profile ────────────────────────────────────────────────────────
        UserDashboardResponse.ProfileSection profile = UserDashboardResponse.ProfileSection.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus().name().toLowerCase())
                .build();

        // ── 2. Addresses ──────────────────────────────────────────────────────
        List<AddressResponse> addresses = user.getAddresses() == null
                ? List.of()
                : user.getAddresses().stream()
                .map(AddressResponse::from)
                .toList();

        // ── 3. Wishlist ───────────────────────────────────────────────────────
        List<UserDashboardResponse.WishlistItemDto> wishlist = wishlistRepository
                .findByUserIdWithProduct(userId)
                .stream()
                .map(w -> {
                    var p = w.getProduct();
                    String img = null;
                    if (p.getImages() != null) {
                        img = p.getImages().stream()
                                .filter(ProductImage::getIsPrimary)
                                .findFirst()
                                .map(ProductImage::getImageUrl)
                                .orElse(p.getImages().isEmpty() ? null
                                        : p.getImages().get(0).getImageUrl());
                    }
                    return UserDashboardResponse.WishlistItemDto.builder()
                            .productId(p.getId())
                            .productName(p.getName())
                            .slug(p.getSlug())
                            .basePrice(p.getBasePrice())
                            .salePrice(p.getSalePrice())
                            .primaryImage(img)
                            .brandName(p.getBrand() != null ? p.getBrand().getName() : null)
                            .addedAt(w.getAddedAt() != null ? w.getAddedAt().format(FMT) : null)
                            .build();
                })
                .toList();

        // ── 4. Orders: summary + recent 5 ────────────────────────────────────
        List<Order> allOrders = orderRepository.findAllByUserIdOrderByOrderedAtDesc(userId);

        long totalOrders = allOrders.size();
        BigDecimal totalSpent = allOrders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED
                        && o.getStatus() != OrderStatus.REFUNDED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String memberLevel = calcMemberLevel(totalSpent);

        UserDashboardResponse.OrderSummarySection orderSummary = UserDashboardResponse.OrderSummarySection.builder()
                .totalOrders(totalOrders)
                .totalSpent(totalSpent)
                .customerType(user.getType().name().toLowerCase())
                .memberLevel(memberLevel)
                .build();

        List<UserDashboardResponse.RecentOrderDto> recentOrders = allOrders.stream()
                .limit(RECENT_ORDERS_LIMIT)
                .map(o -> {
                    var firstItem = (o.getItems() != null && !o.getItems().isEmpty())
                            ? o.getItems().get(0) : null;
                    String firstImg  = null;
                    String firstName = null;
                    if (firstItem != null) {
                        firstName = firstItem.getProduct().getName();
                        var imgs = firstItem.getProduct().getImages();
                        if (imgs != null && !imgs.isEmpty()) {
                            firstImg = imgs.stream()
                                    .filter(ProductImage::getIsPrimary)
                                    .findFirst()
                                    .map(ProductImage::getImageUrl)
                                    .orElse(imgs.get(0).getImageUrl());
                        }
                    }
                    return UserDashboardResponse.RecentOrderDto.builder()
                            .id(o.getId())
                            .orderCode(o.getOrderCode())
                            .status(o.getStatus().name().toLowerCase())
                            .totalAmount(o.getTotalAmount())
                            .orderedAt(o.getOrderedAt() != null ? o.getOrderedAt().format(FMT) : null)
                            .itemCount(o.getItems() != null ? o.getItems().size() : 0)
                            .firstItemImage(firstImg)
                            .firstItemName(firstName)
                            .build();
                })
                .toList();

        return UserDashboardResponse.builder()
                .profile(profile)
                .orderSummary(orderSummary)
                .addresses(addresses)
                .wishlist(wishlist)
                .recentOrders(recentOrders)
                .build();
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private static String calcMemberLevel(BigDecimal totalSpent) {
        if (totalSpent.compareTo(new BigDecimal("50000000")) >= 0) return "Platinum";
        if (totalSpent.compareTo(new BigDecimal("20000000")) >= 0) return "Gold";
        if (totalSpent.compareTo(new BigDecimal("5000000"))  >= 0) return "Silver";
        return "Member";
    }
}
