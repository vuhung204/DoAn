package com.laptopshop.application.admin.review.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Params cho GET /admin/reviews/export.
 */
@Getter
@Setter
@NoArgsConstructor
public class ExportReviewsRequestDto {
    private LocalDate startDate;
    private LocalDate endDate;
    /** PENDING | APPROVED | HIDDEN | null = tất cả */
    private String status;
    /** 1–5 | null = tất cả */
    private Integer rating;
    /** "XLSX" | "CSV" — default XLSX */
    private String format = "XLSX";
}
