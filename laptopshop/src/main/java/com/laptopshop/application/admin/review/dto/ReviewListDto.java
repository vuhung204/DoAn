package com.laptopshop.application.admin.review.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Một hàng trong bảng danh sách review.
 * shortText: 250 ký tự đầu của text, truncate ở service/query.
 * status: "PENDING" | "APPROVED" | "HIDDEN"
 */
@Getter
@AllArgsConstructor
public class ReviewListDto {
    private Long id;
    private Long productId;
    private String productName;
    private Long userId;
    private String customerName;
    private String email;
    private Integer rating;
    private String title;
    /** Tối đa 250 ký tự */
    private String shortText;
    private Integer imageCount;
    private LocalDateTime createdAt;
    /** ReviewStatus enum name: PENDING | APPROVED | HIDDEN */
    private String status;
}