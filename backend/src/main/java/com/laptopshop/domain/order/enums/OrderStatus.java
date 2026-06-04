package com.laptopshop.domain.order.enums;

import java.util.Map;
import java.util.Set;

public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PROCESSING,
    SHIPPING,
    COMPLETED,
    CANCELLED,
    REFUNDED;

    // Các transition hợp lệ: key → có thể chuyển sang các value
    private static final Map<OrderStatus, Set<OrderStatus>> VALID_TRANSITIONS = Map.of(
            PENDING,     Set.of(CONFIRMED, CANCELLED),
            CONFIRMED,   Set.of(PROCESSING, CANCELLED),
            PROCESSING,  Set.of(SHIPPING, CANCELLED),
            SHIPPING,    Set.of(COMPLETED),
            COMPLETED,   Set.of(REFUNDED),
            CANCELLED,   Set.of(),
            REFUNDED,    Set.of()
    );

    public boolean canTransitionTo(OrderStatus next) {
        return VALID_TRANSITIONS.getOrDefault(this, Set.of()).contains(next);
    }

    /**
     * Map từ frontend string → OrderStatus enum.
     * Ném IllegalArgumentException nếu không hợp lệ.
     */
    public static OrderStatus fromFrontend(String frontendValue) {
        return switch (frontendValue.toLowerCase().trim()) {
            case "pending"    -> PENDING;
            case "confirmed"  -> CONFIRMED;
            case "processing" -> PROCESSING;
            case "shipping"   -> SHIPPING;
            case "done"       -> COMPLETED;
            case "cancelled"  -> CANCELLED;
            case "refunded"   -> REFUNDED;
            default -> throw new IllegalArgumentException(
                    "Trạng thái không hợp lệ: " + frontendValue);
        };
    }

    /** Map ngược DB enum → frontend string (dùng cho response). */
    public String toFrontend() {
        return switch (this) {
            case PENDING    -> "pending";
            case CONFIRMED  -> "confirmed";
            case PROCESSING -> "processing";
            case SHIPPING   -> "shipping";
            case COMPLETED  -> "done";
            case CANCELLED  -> "cancelled";
            case REFUNDED   -> "refunded";
        };
    }
}
