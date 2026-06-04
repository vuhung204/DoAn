package com.laptopshop.domain.refund.repository;

import com.laptopshop.domain.refund.entity.ReturnRequest;
import com.laptopshop.domain.refund.enums.ReturnStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {

    /**
     * Danh sách yêu cầu hoàn trả — filter theo search (order_code / tên KH) + status.
     * JOIN: orders → lấy order_code + store_name; users → lấy tên KH.
     * GROUP_CONCAT các tên sản phẩm để trả về dạng "SP A,SP B" cho cột "Sản phẩm".
     */
    @Query(value = """
            SELECT
                rr.return_id,
                o.order_code,
                u.full_name                                     AS customer_name,
                s.name                                          AS store_name,
                rr.refund_amount,
                rr.reason,
                rr.status,
                rr.staff_note,
                rr.requested_at,
                rr.processed_at,
                GROUP_CONCAT(p.name ORDER BY p.name SEPARATOR ', ') AS product_names
            FROM return_requests rr
            JOIN orders      o  ON o.order_id   = rr.order_id
            JOIN users       u  ON u.user_id    = rr.user_id
            JOIN stores      s  ON s.store_id   = o.store_id
            LEFT JOIN order_items oi ON oi.order_id   = o.order_id
            LEFT JOIN products    p  ON p.product_id  = oi.product_id
            WHERE (:search IS NULL
                   OR o.order_code LIKE CONCAT('%', :search, '%')
                   OR u.full_name  LIKE CONCAT('%', :search, '%'))
              AND (:status IS NULL OR rr.status = :status)
            GROUP BY rr.return_id, o.order_code, u.full_name, s.name,
                     rr.refund_amount, rr.reason, rr.status, rr.staff_note,
                     rr.requested_at, rr.processed_at
            ORDER BY rr.requested_at DESC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT rr.return_id)
            FROM return_requests rr
            JOIN orders o ON o.order_id = rr.order_id
            JOIN users  u ON u.user_id  = rr.user_id
            WHERE (:search IS NULL
                   OR o.order_code LIKE CONCAT('%', :search, '%')
                   OR u.full_name  LIKE CONCAT('%', :search, '%'))
              AND (:status IS NULL OR rr.status = :status)
            """,
            nativeQuery = true)
    Page<Object[]> findRefundSummaries(
            @Param("search") String search,
            @Param("status") String status,
            Pageable pageable);

    /**
     * Chi tiết một yêu cầu: kèm danh sách tên từng sản phẩm (mỗi row = 1 SP).
     * Khác query list ở chỗ không GROUP_CONCAT — trả từng dòng để map thành List<String>.
     */
    @Query(value = """
            SELECT
                rr.return_id,
                o.order_code,
                u.full_name     AS customer_name,
                s.name          AS store_name,
                rr.refund_amount,
                rr.reason,
                rr.status,
                rr.staff_note,
                rr.requested_at,
                rr.processed_at,
                p.name          AS product_name
            FROM return_requests rr
            JOIN orders      o  ON o.order_id   = rr.order_id
            JOIN users       u  ON u.user_id    = rr.user_id
            JOIN stores      s  ON s.store_id   = o.store_id
            LEFT JOIN order_items oi ON oi.order_id  = o.order_id
            LEFT JOIN products    p  ON p.product_id = oi.product_id
            WHERE rr.return_id = :returnId
            """,
            nativeQuery = true)
    List<Object[]> findRefundDetail(@Param("returnId") Long returnId);

    /**
     * Thống kê số yêu cầu theo từng trạng thái (cho 5 StatCard).
     */
    @Query(value = """
            SELECT rr.status, COUNT(*) AS cnt
            FROM return_requests rr
            GROUP BY rr.status
            """,
            nativeQuery = true)
    List<Object[]> countByStatus();

    Page<ReturnRequest> findByUser_Id(Long userId, Pageable pageable);

    Page<ReturnRequest> findByStatus(ReturnStatus status, Pageable pageable);

    @Query("SELECT r FROM ReturnRequest r WHERE r.order.id = :orderId AND r.user.id = :userId")
    Optional<ReturnRequest> findByOrderIdAndUserId(@Param("orderId") Long orderId,
                                                   @Param("userId") Long userId);

    boolean existsByOrder_IdAndUser_IdAndStatusNotIn(
            Long orderId, Long userId, java.util.List<ReturnStatus> excludedStatuses);

    @Query("""
        SELECT i.orderItem.id FROM ReturnRequest r
        JOIN r.items i
        WHERE r.user.id = :userId
          AND r.order.id = :orderId
        """)
    List<Long> findOrderItemIdsByUserId(@Param("userId") Long userId,
                                        @Param("orderId") Long orderId);
}