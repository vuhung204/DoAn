package com.laptopshop.application.admin.review.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * Stat card trên trang Review.
 * Ví dụ: label="Tổng review", value="1,248", icon="rate_review", iconClass="icon-review"
 */
@Getter
@AllArgsConstructor
public class ReviewStatsDto {
    private String label;
    private String value;
    private String icon;
    private String iconClass;
    /**
     * Phân bổ rating 1–5 (kèm theo stat card tổng quan).
     * null cho các stat card khác; chỉ set ở card "Tổng review" hoặc trả riêng.
     */
    private List<RatingDistributionDto> ratingDistribution;

    // ── nested DTO ─────────────────────────────────────────────────────────
    @Getter
    @AllArgsConstructor
    public static class RatingDistributionDto {
        /** 1–5 */
        private int rating;
        /** Số lượng review có rating này */
        private long count;
        /** Tỷ lệ %, scale=1 */
        private double percent;
    }
}
