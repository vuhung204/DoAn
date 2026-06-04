package com.laptopshop.application.admin.order.service;

import com.laptopshop.application.admin.order.dto.*;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface AdminOrderService {

    /**
     * Tìm kiếm & phân trang danh sách đơn hàng.
     *
     * @param q       từ khóa (orderCode / tên khách) — nullable
     * @param status  frontend status string — nullable
     * @param storeId ID chi nhánh — nullable
     * @param pageable trang + sắp xếp
     */
    PageDto<OrderListDto> searchOrders(String q, String status, Long storeId,
                                       LocalDateTime from, LocalDateTime to,
                                       Pageable pageable);

    /** Lấy chi tiết đơn hàng kèm items và lịch sử. */
    OrderDetailDto getOrderDetail(Long orderId);

    /**
     * Cập nhật trạng thái đơn hàng.
     * Validate transition, lưu OrderHistory, cập nhật tồn kho nếu cần.
     *
     * @param staffId ID nhân viên thực hiện (lấy từ JWT context)
     */
    void updateOrderStatus(Long orderId, com.laptopshop.application.admin.order.dto.UpdateOrderStatusRequestDto req, Long staffId);

    /** Lấy danh sách items của đơn, có phân trang. */
    PageDto<OrderItemDto> getOrderItems(Long orderId, Pageable pageable);

    /**
     * Tạo yêu cầu hoàn tiền.
     * Validate: amount <= (totalAmount - tổng đã refund).
     */
    RefundDto createRefund(Long orderId, RefundRequestDto req, Long staffId);

    /**
     * Tạo shipment record, chuyển trạng thái đơn sang SHIPPING.
     */
    void shipOrder(Long orderId, ShipRequestDto req, Long staffId);

    /**
     * Xuất file XLSX danh sách/chi tiết đơn hàng.
     * @return byte[] nội dung file XLSX
     */
    byte[] exportOrders(ExportRequestDto req);

    /** Thống kê số đơn theo trạng thái và tổng doanh thu. */
    OrdersStatsDto getStats(LocalDateTime from, LocalDateTime to, Long storeId);

    /**
     * Admin / Staff tạo đơn hàng thay mặt khách.
     */
    AdminCreateOrderResult createOrderByStaff(AdminCreateOrderRequest request, Long staffId);
}