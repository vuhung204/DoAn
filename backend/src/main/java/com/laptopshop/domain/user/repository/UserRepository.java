package com.laptopshop.domain.user.repository;

import com.laptopshop.domain.user.entity.User;
import com.laptopshop.domain.user.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // ─────────────────────────────────────────────
    // Dashboard: Đếm khách hàng mới (stat card)
    // ─────────────────────────────────────────────

    /**
     * Đếm user đăng ký trong khoảng thời gian — dùng cho stat card "Khách hàng mới".
     * User.createdAt kế thừa từ BaseEntity.
     */
    @Query("""
            SELECT COUNT(u)
            FROM User u
            WHERE u.createdAt BETWEEN :start AND :end
            """)
    long countNewUsersBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    // ══════════════════════════════════════════════════════════════════════
    // CUSTOMER — Stat cards
    // ══════════════════════════════════════════════════════════════════════

    /** Tổng khách hàng */
    long countByStatusNot(UserStatus status);

    /** Đếm tài khoản bị khoá */
    long countByStatus(UserStatus status);

    // ══════════════════════════════════════════════════════════════════════
    // CUSTOMER — Search + filter (danh sách có phân trang)
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Tìm kiếm theo tên / email / phone, filter theo status.
     * status = null → bỏ qua filter.
     */
    @Query("""
            SELECT u FROM User u
            WHERE (:q IS NULL OR (
                      LOWER(u.fullName) LIKE LOWER(CONCAT('%',:q,'%'))
                   OR LOWER(u.email)    LIKE LOWER(CONCAT('%',:q,'%'))
                   OR u.phone           LIKE      CONCAT('%',:q,'%')
            ))
            AND (:status IS NULL OR u.status = :status)
            ORDER BY u.createdAt DESC
            """)
    Page<User> searchCustomers(
            @Param("q")      String q,
            @Param("status") UserStatus status,
            Pageable pageable
    );

    // ══════════════════════════════════════════════════════════════════════
    // CUSTOMER — Top customers by revenue (native)
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Top N khách hàng theo tổng chi tiêu trong kỳ.
     * Trả Object[]:
     *   [0] Long    userId
     *   [1] String  fullName
     *   [2] String  email
     *   [3] BigDecimal revenue (VND)
     *   [4] Long    orderCount
     */
    @Query(value = """
            SELECT u.user_id,
                   u.full_name,
                   u.email,
                   SUM(o.total_amount)  AS revenue,
                   COUNT(o.order_id)    AS order_count
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
              AND (:storeId IS NULL OR o.store_id = :storeId)
            GROUP BY u.user_id, u.full_name, u.email
            ORDER BY revenue DESC
            LIMIT :limitVal
            """,
            nativeQuery = true)
    List<Object[]> findTopCustomersByRevenue(
            @Param("start")    LocalDateTime start,
            @Param("end")      LocalDateTime end,
            @Param("storeId")  Long storeId,
            @Param("limitVal") int limitVal
    );

    // ══════════════════════════════════════════════════════════════════════
    // CUSTOMER — Đếm "hot customers" (chi tiêu >= ngưỡng trong kỳ)
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Đếm khách có tổng chi tiêu >= hotThreshold VND trong kỳ.
     * Dùng cho stat card "Khách hàng hot".
     */
    @Query(value = """
            SELECT COUNT(*) FROM (
                SELECT o.user_id
                FROM orders o
                WHERE o.ordered_at BETWEEN :start AND :end
                  AND o.status NOT IN ('CANCELLED','REFUNDED')
                  AND (:storeId IS NULL OR o.store_id = :storeId)
                GROUP BY o.user_id
                HAVING SUM(o.total_amount) >= :hotThreshold
            ) t
            """,
            nativeQuery = true)
    long countHotCustomers(
            @Param("start")        LocalDateTime start,
            @Param("end")          LocalDateTime end,
            @Param("storeId")      Long storeId,
            @Param("hotThreshold") long hotThreshold
    );

    // ══════════════════════════════════════════════════════════════════════
    // CUSTOMER — Aggregate stats per user (totalOrders, totalSpent)
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Tổng đơn + tổng chi tiêu cho một tập user.
     * Trả Object[]: [0]=Long(userId), [1]=Long(orderCount), [2]=BigDecimal(totalSpent)
     */
    @Query(value = """
            SELECT o.user_id,
                   COUNT(o.order_id)   AS order_count,
                   SUM(o.total_amount) AS total_spent
            FROM orders o
            WHERE o.user_id IN (:userIds)
              AND o.status NOT IN ('CANCELLED','REFUNDED')
            GROUP BY o.user_id
            """,
            nativeQuery = true)
    List<Object[]> findOrderStatsByUserIds(@Param("userIds") List<Long> userIds);

    // ══════════════════════════════════════════════════════════════════════
    // CUSTOMER — Detail: fetch user kèm addresses
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Fetch user cùng danh sách addresses trong 1 query (tránh N+1).
     */
    @Query("""
            SELECT u FROM User u
            LEFT JOIN FETCH u.addresses
            WHERE u.id = :id
            """)
    Optional<User> findByIdWithAddresses(@Param("id") Long id);


}
