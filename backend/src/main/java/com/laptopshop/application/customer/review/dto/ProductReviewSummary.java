package com.laptopshop.application.customer.review.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
@AllArgsConstructor
public class ProductReviewSummary {
    private Double averageRating;
    private Long totalReviews;
    private ReviewPageData reviews;

    @Getter
    @AllArgsConstructor
    public static class ReviewPageData {
        private List<ReviewResponse> content;
        private int totalPages;
        private long totalElements;
        private int number;

        public static ReviewPageData from(Page<ReviewResponse> page) {
            return new ReviewPageData(
                    page.getContent(),
                    page.getTotalPages(),
                    page.getTotalElements(),
                    page.getNumber()
            );
        }
    }
}