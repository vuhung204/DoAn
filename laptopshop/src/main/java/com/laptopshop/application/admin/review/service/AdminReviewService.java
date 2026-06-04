package com.laptopshop.application.admin.review.service;

import com.laptopshop.application.admin.dashboard.dto.PageDto;
import com.laptopshop.application.admin.review.dto.*;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface AdminReviewService {

    /**
     * Tìm kiếm + filter review (server-side paging).
     * q      = search theo product name / customer name / email
     * status = "PENDING" | "APPROVED" | "HIDDEN" | null = tất cả
     * rating = 1–5 | null = tất cả
     */
    PageDto<ReviewListDto> searchReviews(String q, String status, Integer rating,
                                         LocalDate startDate, LocalDate endDate,
                                         Pageable pageable);

    /** Chi tiết review kèm images, reply, orderCode. */
    ReviewDetailDto getReview(Long id);

    /**
     * Chỉnh sửa nội dung review (title/text/rating).
     * Chỉ cập nhật field không null trong request.
     */
    ReviewDetailDto updateReview(Long id, ReviewUpdateRequestDto dto);

    /**
     * Cập nhật status: PENDING → APPROVED / HIDDEN và ngược lại.
     * updatedBy: tên staff lấy từ SecurityContext (truyền từ controller).
     */
    void updateStatus(Long id, String status, String updatedBy);

    /**
     * Lưu reply của staff.
     * repliedBy: staff username/email từ SecurityContext.
     */
    void replyReview(Long id, ReviewReplyRequestDto dto, String repliedBy);

    /** Xóa vĩnh viễn review (kèm images do cascade). */
    void deleteReview(Long id);

    /**
     * Stat cards + rating distribution cho ReviewStats section.
     * startDate/endDate mặc định = 30 ngày nếu null.
     */
    List<ReviewStatsDto> getStats(LocalDate startDate, LocalDate endDate);

    /**
     * Xuất danh sách review ra file Excel hoặc CSV.
     * format = "XLSX" | "CSV"
     */
    byte[] exportReviews(ExportReviewsRequestDto req);
}
