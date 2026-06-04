package com.laptopshop.application.admin.review.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request body cho PATCH /admin/reviews/{id}/status.
 */
@Getter
@Setter
@NoArgsConstructor
public class ReviewStatusUpdateDto {
    @NotBlank(message = "status không được để trống")
    @Pattern(regexp = "PENDING|APPROVED|HIDDEN",
            message = "status phải là: PENDING | APPROVED | HIDDEN")
    private String status;
}