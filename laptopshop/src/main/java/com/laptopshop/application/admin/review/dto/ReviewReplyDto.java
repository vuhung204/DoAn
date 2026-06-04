package com.laptopshop.application.admin.review.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/** Reply của staff cho review. */
@Getter
@AllArgsConstructor
public class ReviewReplyDto {
    /** Tên staff đã reply */
    private String by;
    private String text;
    private LocalDateTime repliedAt;
}