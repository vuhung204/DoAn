package com.laptopshop.domain.review.enums;

public enum ReviewStatus {
    /** Mới tạo, chờ duyệt */
    PENDING,
    /** Đã duyệt — hiển thị công khai */
    APPROVED,
    /** Bị ẩn bởi admin/staff */
    HIDDEN;

    public static ReviewStatus fromString(String value) {
        return ReviewStatus.valueOf(value.toUpperCase());
    }
}