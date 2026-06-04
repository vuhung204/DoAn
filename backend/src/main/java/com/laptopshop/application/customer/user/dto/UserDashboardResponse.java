package com.laptopshop.application.customer.user.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response cho GET /api/user/dashboard
 *
 * Gộp toàn bộ data ProfilePage cần vào 1 call thay vì 4 calls riêng lẻ:
 *   - profile (thông tin cá nhân)
 *   - orderSummary (tổng đơn, tổng chi tiêu, hạng thành viên)
 *   - addresses (danh sách địa chỉ)
 *   - wishlist (danh sách yêu thích)
 *   - recentOrders (5 đơn gần nhất cho tab overview)
 */
@Getter
@Builder
public class UserDashboardResponse {

    private ProfileSection      profile;
    private OrderSummarySection orderSummary;
    private List<AddressResponse>  addresses;
    private List<WishlistItemDto>  wishlist;
    private List<RecentOrderDto>   recentOrders;

    // ─── Nested DTOs ──────────────────────────────────────────────────────────

    @Getter
    @Builder
    public static class ProfileSection {
        private Long   id;
        private String fullName;
        private String email;
        private String phone;
        private String avatarUrl;
        private String status;
    }

    @Getter
    @Builder
    public static class OrderSummarySection {
        private long       totalOrders;
        private BigDecimal totalSpent;
        /** NEW | REGULAR | VIP  (từ users.type) */
        private String     customerType;
        /**
         * Hạng hiển thị tính từ totalSpent:
         *   >= 50tr → Platinum, >= 20tr → Gold, >= 5tr → Silver, else → Member
         */
        private String     memberLevel;
    }

    @Getter
    @Builder
    public static class WishlistItemDto {
        private Long       productId;
        private String     productName;
        private String     slug;
        private BigDecimal basePrice;
        private BigDecimal salePrice;
        private String     primaryImage;
        private String     brandName;
        private String     addedAt;
    }

    @Getter
    @Builder
    public static class RecentOrderDto {
        private Long       id;
        private String     orderCode;
        private String     status;
        private BigDecimal totalAmount;
        private String     orderedAt;
        private int        itemCount;
        /** Ảnh sản phẩm đầu tiên trong đơn */
        private String     firstItemImage;
        private String     firstItemName;
    }
}
