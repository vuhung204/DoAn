package com.laptopshop.application.admin.refund.service;

import com.laptopshop.application.admin.refund.dto.PageDto;
import com.laptopshop.application.admin.refund.dto.*;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface AdminRefundService {

    /**
     * Tìm kiếm & phân trang danh sách refund.
     *
     * @param q       từ khóa (orderCode / tên khách) — nullable
     * @param status  frontend status string — nullable
     * @param storeId ID chi nhánh — nullable
     */
    PageDto<RefundListDto> searchRefunds(String q, String status, Long storeId,
                                         LocalDateTime from, LocalDateTime to,
                                         Pageable pageable);

    /** Chi tiết một refund request. */
    RefundDetailDto getRefund(Long refundId);

    /**
     * Tạo yêu cầu hoàn trả mới.
     * Validate: order tồn tại, amount <= refundableAmount.
     */
    RefundDetailDto createRefund(CreateRefundRequestDto req);

    /**
     * Phê duyệt refund request: PENDING → APPROVED.
     * Ném 409 nếu đã xử lý rồi.
     */
    RefundDetailDto approveRefund(Long refundId, ProcessRefundRequestDto req);

    /**
     * Từ chối refund request: PENDING → REJECTED.
     * Ném 409 nếu đã xử lý rồi.
     */
    RefundDetailDto rejectRefund(Long refundId, ProcessRefundRequestDto req);

    /**
     * Xác nhận hoàn tiền thực tế: APPROVED → REFUNDED.
     * Ghi transactionRef, refundMethod, cập nhật Payment status.
     */
    RefundDetailDto completeRefund(Long refundId, CompleteRefundRequestDto req);

    /** Thống kê refund theo trạng thái + tổng tiền. */
    RefundStatsDto getStats(LocalDateTime from, LocalDateTime to, Long storeId);

    /**
     * Xuất XLSX danh sách refund.
     * @return byte[] nội dung file
     */
    byte[] exportRefunds(ExportRequestDto req);
}
