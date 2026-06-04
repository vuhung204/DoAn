package com.laptopshop.domain.user.enums;

public enum CustomerType {
    NEW,
    REGULAR,
    VIP;

    public String toFrontend() {
        return name().toLowerCase();
    }

    public static CustomerType fromFrontend(String s) {
        return switch (s.toLowerCase().trim()) {
            case "new"     -> NEW;
            case "regular" -> REGULAR;
            case "vip"     -> VIP;
            default -> throw new IllegalArgumentException("Loại khách không hợp lệ: " + s);
        };
    }
}
