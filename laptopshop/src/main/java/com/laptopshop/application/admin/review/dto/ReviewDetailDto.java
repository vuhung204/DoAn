package com.laptopshop.application.admin.review.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Chi tiết đầy đủ một review — ReviewDetailPanel.
 */
@Getter
@AllArgsConstructor
public class ReviewDetailDto {
    private Long id;
    private Long productId;
    private String productName;
    /** SKU sản phẩm */
    private String productSku;
    private Long userId;
    private String customerName;
    private String email;
    private Integer rating;
    private String title;
    private String text;
    private List<String> imageUrls;
    private LocalDateTime createdAt;
    /** PENDING | APPROVED | HIDDEN */
    private String status;
    /** null nếu chưa có reply */
    private ReviewReplyDto reply;
    /** Mã đơn hàng liên quan — null nếu không có */
    private String orderCode;
}
