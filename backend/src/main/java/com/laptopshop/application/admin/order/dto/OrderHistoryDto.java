package com.laptopshop.application.admin.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * DTO lịch sử đơn hàng.
 * FE dùng: { label, time (string "2026-04-05 10:30"), done (boolean) }
 */
@Getter
@AllArgsConstructor
public class OrderHistoryDto {
    /** Tên trạng thái hiển thị: "Đã xác nhận", "Đang giao hàng"... */
    private String  label;
    /** Thời gian dạng string "2026-04-05 10:30" hoặc "" nếu chưa xảy ra */
    private String  time;
    /** Tên nhân viên thực hiện, null nếu hệ thống tự động */
    private String  staff;
    private String  note;
    /** true = bước đã hoàn tất (dùng render timeline) */
    private Boolean done;
}
