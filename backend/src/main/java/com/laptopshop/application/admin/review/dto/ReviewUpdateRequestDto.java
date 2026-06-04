package com.laptopshop.application.admin.review.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Request body cho PUT /admin/reviews/{id}.
 * Tất cả fields đều optional — chỉ cập nhật field không null.
 */
@Getter
@Setter
@NoArgsConstructor
public class ReviewUpdateRequestDto {
    private String title;
    private String text;
    @Min(1) @Max(5)
    private Integer rating;
}