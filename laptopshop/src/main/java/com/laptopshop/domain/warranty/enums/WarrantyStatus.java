package com.laptopshop.domain.warranty.enums;

public enum WarrantyStatus {
    PENDING,      // Khách vừa tạo yêu cầu
    APPROVED,     // Staff đã duyệt, nhận máy
    IN_REPAIR,    // Đang sửa chữa / thay linh kiện
    COMPLETED,    // Sửa xong, đã trả máy cho khách
    REJECTED,     // Từ chối (hết hạn bảo hành, lỗi do người dùng...)
    CANCELLED;    // Khách tự hủy khi còn PENDING

    public boolean canTransitionTo(WarrantyStatus next) {
        return switch (this) {
            case PENDING   -> next == APPROVED || next == REJECTED || next == CANCELLED;
            case APPROVED  -> next == IN_REPAIR || next == REJECTED;
            case IN_REPAIR -> next == COMPLETED;
            default        -> false;
        };
    }

    public boolean isTerminal() {
        return this == COMPLETED || this == REJECTED || this == CANCELLED;
    }
}
