package com.laptopshop.domain.inventory.enums;

public enum InventoryTicketStatus {
    DRAFT,      // Mới tạo, chưa xử lý
    CONFIRMED,  // Đã xác nhận, đang xử lý
    COMPLETED,  // Hoàn thành — stock đã cập nhật
    CANCELLED   // Đã huỷ
}
