package com.laptopshop.domain.order.enums;

public enum DiscountType {
    PERCENT,    // Giảm theo %
    FIXED,      // Giảm số tiền cố định
    FREE_SHIP;  // Miễn phí vận chuyển

    public String toFrontend() {
        return name().toLowerCase();
    }

    public static DiscountType fromFrontend(String s) {
        return switch (s.toLowerCase().trim()) {
            case "percent"   -> PERCENT;
            case "fixed"     -> FIXED;
            case "free_ship" -> FREE_SHIP;
            default -> throw new IllegalArgumentException("Loại khuyến mãi không hợp lệ: " + s);
        };
    }
}
