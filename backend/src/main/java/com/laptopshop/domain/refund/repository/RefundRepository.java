package com.laptopshop.domain.refund.repository;

import com.laptopshop.domain.refund.entity.ReturnRequest;
import com.laptopshop.domain.refund.enums.ReturnStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RefundRepository extends JpaRepository<ReturnRequest, Long> {

    List<ReturnRequest> findByOrderId(@Param("orderId") Long orderId);

    Optional<ReturnRequest> findFirstByOrderIdOrderByRequestedAtDesc(Long orderId);

    /**
     * Tổng số tiền đã refund (các request ở trạng thái APPROVED) của một đơn.
     * Dùng để validate refund mới không vượt quá tổng đã thanh toán.
     */
    @Query("""
            SELECT COALESCE(SUM(r.refundAmount), 0)
            FROM ReturnRequest r
            WHERE r.order.id = :orderId
              AND r.status = :status
            """)
    BigDecimal sumRefundedAmount(
            @Param("orderId") Long orderId,
            @Param("status") ReturnStatus status
    );

    // ── Queries cho module Refund Admin ──────────────────────────────────────

    /**
     * Tìm kiếm refund với bộ lọc động — JPQL.
     * :q       → tìm theo orderCode hoặc tên khách (nullable)
     * :status  → DB enum string (nullable)
     * :storeId → chi nhánh (nullable)
     * :from / :to → khoảng thời gian (nullable)
     */
    @Query(
            value = """
            SELECT r FROM ReturnRequest r
            JOIN FETCH r.order  o
            JOIN FETCH r.user   u
            JOIN FETCH o.store  s
            LEFT JOIN FETCH r.staff st
            WHERE (:q IS NULL
                   OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%',:q,'%'))
                   OR LOWER(u.fullName)  LIKE LOWER(CONCAT('%',:q,'%')))
              AND (:status  IS NULL OR CAST(r.status AS string) = :status)
              AND (:storeId IS NULL OR s.id = :storeId)
              AND (:from    IS NULL OR r.requestedAt >= :from)
              AND (:to      IS NULL OR r.requestedAt <= :to)
            ORDER BY r.requestedAt DESC
            """,
            countQuery = """
            SELECT COUNT(r) FROM ReturnRequest r
            JOIN r.order  o
            JOIN r.user   u
            JOIN o.store  s
            WHERE (:q IS NULL
                   OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%',:q,'%'))
                   OR LOWER(u.fullName)  LIKE LOWER(CONCAT('%',:q,'%')))
              AND (:status  IS NULL OR CAST(r.status AS string) = :status)
              AND (:storeId IS NULL OR s.id = :storeId)
              AND (:from    IS NULL OR r.requestedAt >= :from)
              AND (:to      IS NULL OR r.requestedAt <= :to)
            """)
    Page<ReturnRequest> searchRefunds(
            @Param("q")       String q,
            @Param("status")  String status,
            @Param("storeId") Long storeId,
            @Param("from")    LocalDateTime from,
            @Param("to")      LocalDateTime to,
            Pageable pageable
    );

    /**
     * Lấy chi tiết refund kèm đầy đủ relations — tránh N+1 cho RefundDetailDto.
     */
    @Query("""
            SELECT r FROM ReturnRequest r
            JOIN FETCH r.order        o
            JOIN FETCH r.user         u
            JOIN FETCH o.store        s
            LEFT JOIN FETCH r.staff   st
            LEFT JOIN FETCH r.items   ri
            LEFT JOIN FETCH ri.orderItem oi
            LEFT JOIN FETCH oi.product   p
            WHERE r.id = :refundId
            """)
    Optional<ReturnRequest> findDetailById(@Param("refundId") Long refundId);

    /**
     * Thống kê số lượng và tổng tiền refund theo trạng thái.
     * Trả về Object[]: [0]=status(String), [1]=count(Long), [2]=totalAmount(BigDecimal)
     */
    @Query(value = """
            SELECT r.status,
                   COUNT(*)             AS cnt,
                   SUM(r.refund_amount) AS total_amount
            FROM return_requests r
            JOIN orders o ON r.order_id = o.order_id
            WHERE (:storeId IS NULL OR o.store_id = :storeId)
              AND (:from    IS NULL OR r.requested_at >= :from)
              AND (:to      IS NULL OR r.requested_at <= :to)
            GROUP BY r.status
            """, nativeQuery = true)
    List<Object[]> statsByStatus(
            @Param("from")    LocalDateTime from,
            @Param("to")      LocalDateTime to,
            @Param("storeId") Long storeId
    );

    /**
     * Export: toàn bộ refund không phân trang — cùng filter như search.
     */
    @Query("""
            SELECT r FROM ReturnRequest r
            JOIN FETCH r.order  o
            JOIN FETCH r.user   u
            JOIN FETCH o.store  s
            LEFT JOIN FETCH r.staff st
            WHERE (:q IS NULL
                   OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%',:q,'%'))
                   OR LOWER(u.fullName)  LIKE LOWER(CONCAT('%',:q,'%')))
              AND (:status  IS NULL OR CAST(r.status AS string) = :status)
              AND (:storeId IS NULL OR s.id = :storeId)
              AND (:from    IS NULL OR r.requestedAt >= :from)
              AND (:to      IS NULL OR r.requestedAt <= :to)
            ORDER BY r.requestedAt DESC
            """)
    List<ReturnRequest> findForExport(
            @Param("q")       String q,
            @Param("status")  String status,
            @Param("storeId") Long storeId,
            @Param("from")    LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
