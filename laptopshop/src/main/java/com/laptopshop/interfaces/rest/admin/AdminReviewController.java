package com.laptopshop.interfaces.rest.admin;

import com.laptopshop.application.admin.dashboard.dto.PageDto;
import com.laptopshop.application.admin.review.dto.*;
import com.laptopshop.application.admin.review.service.AdminReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Review Management REST API — prefix: /api/admin/reviews
 *
 * Permissions:
 *  - read (list/detail/stats): SUPER_ADMIN, STORE_MANAGER, SALES_STAFF
 *  - actions (update/status/reply/delete/export): SUPER_ADMIN, STORE_MANAGER
 */
@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final AdminReviewService reviewService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<PageDto<ReviewListDto>> searchReviews(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort.Direction dir = "asc".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        // FIX: native query dùng created_at — nhưng dùng Pageable với unsorted
        // để tránh lỗi "Unknown column" như ProductRepository
        // Sort được inject trực tiếp trong native query ORDER BY
        Pageable pageable = PageRequest.of(page, size);

        return ResponseEntity.ok(
                reviewService.searchReviews(q, status, rating, startDate, endDate, pageable)
        );
    }

    // PHẢI đặt trước /{id}
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<List<ReviewStatsDto>> getStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(reviewService.getStats(startDate, endDate));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<byte[]> exportReviews(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "XLSX") String format
    ) {
        ExportReviewsRequestDto req = new ExportReviewsRequestDto();
        req.setStartDate(startDate); req.setEndDate(endDate);
        req.setStatus(status); req.setRating(rating); req.setFormat(format);

        byte[] bytes  = reviewService.exportReviews(req);
        boolean isCsv = "CSV".equalsIgnoreCase(format);
        String  ext   = isCsv ? "csv" : "xlsx";
        String  filename = "reviews-" + LocalDate.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "." + ext;

        MediaType mediaType = isCsv
                ? MediaType.parseMediaType("text/csv; charset=UTF-8")
                : MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(bytes.length);
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<ReviewDetailDto> getReview(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getReview(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<ReviewDetailDto> updateReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewUpdateRequestDto dto
    ) {
        return ResponseEntity.ok(reviewService.updateReview(id, dto));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<Void> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReviewStatusUpdateDto dto,
            Authentication authentication
    ) {
        reviewService.updateStatus(id, dto.getStatus(), requireActor(authentication));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reply")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<ReviewDetailDto> replyReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewReplyRequestDto dto,
            Authentication authentication
    ) {
        reviewService.replyReview(id, dto, requireActor(authentication));
        return ResponseEntity.ok(reviewService.getReview(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }

    private String requireActor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new IllegalStateException("Không xác định được tài khoản thực hiện thao tác");
        }
        return authentication.getName();
    }
}
