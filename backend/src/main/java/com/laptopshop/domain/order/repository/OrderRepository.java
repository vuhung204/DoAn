package com.laptopshop.domain.order.repository;

import com.laptopshop.domain.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findAllByUserIdOrderByOrderedAtDesc(Long userId);
    Optional<Order> findByIdAndUserId(Long id, Long userId);

    // ── Dashboard Stats ─────────────────────────────────────────────

    // Tổng doanh thu theo ngày
    @Query("""
            SELECT COALESCE(SUM(o.totalAmount), 0)
            FROM Order o
            WHERE FUNCTION('DATE', o.orderedAt) = :date
              AND o.status NOT IN ('CANCELLED', 'REFUNDED')
            """)
    BigDecimal sumRevenueByDate(@Param("date") LocalDate date);

    // Đếm đơn hàng theo ngày
    @Query("""
            SELECT COUNT(o)
            FROM Order o
            WHERE FUNCTION('DATE', o.orderedAt) = :date
            """)
    long countByDate(@Param("date") LocalDate date);

    // Đếm đơn theo status (tất cả)
    @Query("""
            SELECT o.status, COUNT(o)
            FROM Order o
            GROUP BY o.status
            """)
    List<Object[]> countGroupByStatus();

    // ── Dashboard Revenue Chart (7 ngày) ────────────────────────────

    @Query(value = """
            SELECT s.store_id, s.name,
                   DATE(o.ordered_at) AS period,
                   COALESCE(SUM(o.total_amount), 0) AS revenue
            FROM stores s
            LEFT JOIN orders o
                   ON o.store_id = s.store_id
                  AND o.ordered_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                  AND o.status NOT IN ('CANCELLED','REFUNDED')
            WHERE s.is_active = 1
            GROUP BY s.store_id, s.name, DATE(o.ordered_at)
            ORDER BY s.store_id, period
            """, nativeQuery = true)
    List<Object[]> revenueByDayPerStore();

    // ── Revenue Chart theo tháng (12 tháng) ─────────────────────────

    @Query(value = """
            SELECT s.store_id, s.name,
                   DATE_FORMAT(o.ordered_at, '%m/%Y') AS period,
                   COALESCE(SUM(o.total_amount), 0) AS revenue
            FROM stores s
            LEFT JOIN orders o
                   ON o.store_id = s.store_id
                  AND o.ordered_at >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
                  AND o.status NOT IN ('CANCELLED','REFUNDED')
            WHERE s.is_active = 1
            GROUP BY s.store_id, s.name, DATE_FORMAT(o.ordered_at, '%m/%Y')
            ORDER BY s.store_id, MIN(o.ordered_at)
            """, nativeQuery = true)
    List<Object[]> revenueByMonthPerStore();

    // ── Revenue Chart theo năm ───────────────────────────────────────

    @Query(value = """
            SELECT s.store_id, s.name,
                   YEAR(o.ordered_at) AS period,
                   COALESCE(SUM(o.total_amount), 0) AS revenue
            FROM stores s
            LEFT JOIN orders o
                   ON o.store_id = s.store_id
                  AND o.status NOT IN ('CANCELLED','REFUNDED')
            WHERE s.is_active = 1
            GROUP BY s.store_id, s.name, YEAR(o.ordered_at)
            ORDER BY s.store_id, period
            """, nativeQuery = true)
    List<Object[]> revenueByYearPerStore();

    // ── Branch Compare: doanh thu chi nhánh tuần này vs tuần trước ──

    @Query(value = """
            SELECT s.store_id, s.name,
                   COALESCE(SUM(CASE
                       WHEN o.ordered_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                       THEN o.total_amount END), 0) AS cur_revenue,
                   COALESCE(SUM(CASE
                       WHEN o.ordered_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
                        AND o.ordered_at <  DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                       THEN o.total_amount END), 0) AS prev_revenue
            FROM stores s
            LEFT JOIN orders o
                   ON o.store_id = s.store_id
                  AND o.status NOT IN ('CANCELLED','REFUNDED')
            WHERE s.is_active = 1
            GROUP BY s.store_id, s.name
            ORDER BY cur_revenue DESC
            """, nativeQuery = true)
    List<Object[]> branchCompareByDay();

    // ── Branch Compare: tháng này vs tháng trước ────────────────────

    @Query(value = """
            SELECT s.store_id, s.name,
                   COALESCE(SUM(CASE
                       WHEN MONTH(o.ordered_at) = MONTH(CURDATE())
                        AND YEAR(o.ordered_at)  = YEAR(CURDATE())
                       THEN o.total_amount END), 0) AS cur_revenue,
                   COALESCE(SUM(CASE
                       WHEN MONTH(o.ordered_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                        AND YEAR(o.ordered_at)  = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                       THEN o.total_amount END), 0) AS prev_revenue
            FROM stores s
            LEFT JOIN orders o
                   ON o.store_id = s.store_id
                  AND o.status NOT IN ('CANCELLED','REFUNDED')
            WHERE s.is_active = 1
            GROUP BY s.store_id, s.name
            ORDER BY cur_revenue DESC
            """, nativeQuery = true)
    List<Object[]> branchCompareByMonth();

    // ── Branch Compare: năm nay vs năm ngoái ────────────────────────

    @Query(value = """
            SELECT s.store_id, s.name,
                   COALESCE(SUM(CASE
                       WHEN YEAR(o.ordered_at) = YEAR(CURDATE())
                       THEN o.total_amount END), 0) AS cur_revenue,
                   COALESCE(SUM(CASE
                       WHEN YEAR(o.ordered_at) = YEAR(CURDATE()) - 1
                       THEN o.total_amount END), 0) AS prev_revenue
            FROM stores s
            LEFT JOIN orders o
                   ON o.store_id = s.store_id
                  AND o.status NOT IN ('CANCELLED','REFUNDED')
            WHERE s.is_active = 1
            GROUP BY s.store_id, s.name
            ORDER BY cur_revenue DESC
            """, nativeQuery = true)
    List<Object[]> branchCompareByYear();

    // ── Dashboard Branch Chart: doanh thu theo store hôm nay ────────

    @Query(value = """
            SELECT s.store_id, s.name,
                   COALESCE(SUM(o.total_amount), 0) AS revenue
            FROM stores s
            LEFT JOIN orders o
                   ON o.store_id = s.store_id
                  AND DATE(o.ordered_at) = CURDATE()
                  AND o.status NOT IN ('CANCELLED','REFUNDED')
            WHERE s.is_active = 1
            GROUP BY s.store_id, s.name
            ORDER BY revenue DESC
            """, nativeQuery = true)
    List<Object[]> revenueByStoreToday();

    // ── Danh sách năm có dữ liệu ─────────────────────────────────────

    @Query(value = """
            SELECT DISTINCT YEAR(ordered_at)
            FROM orders
            WHERE status NOT IN ('CANCELLED','REFUNDED')
            ORDER BY 1 ASC
            """, nativeQuery = true)
    List<Integer> findDistinctYears();

    @Query("""
            SELECT COALESCE(SUM(o.totalAmount), 0)
            FROM Order o
            WHERE o.orderedAt BETWEEN :start AND :end
              AND (:storeId IS NULL OR o.store.id = :storeId)
              AND o.status NOT IN (
                  com.laptopshop.domain.order.enums.OrderStatus.CANCELLED,
                  com.laptopshop.domain.order.enums.OrderStatus.REFUNDED
              )
            """)
    BigDecimal sumTotalAmountByDateRangeAndStore(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("storeId") Long storeId
    );

    @Query("""
            SELECT COUNT(o)
            FROM Order o
            WHERE o.orderedAt BETWEEN :start AND :end
              AND (:storeId IS NULL OR o.store.id = :storeId)
            """)
    long countOrdersByDateRangeAndStore(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("storeId") Long storeId
    );

    @Query(value = """
            SELECT DATE(ordered_at) AS dt,
                   SUM(total_amount) AS revenue
            FROM orders
            WHERE ordered_at BETWEEN :start AND :end
              AND (:storeId IS NULL OR store_id = :storeId)
              AND status NOT IN ('CANCELLED', 'REFUNDED')
            GROUP BY DATE(ordered_at)
            ORDER BY DATE(ordered_at)
            """, nativeQuery = true)
    List<Object[]> findRevenueGroupedByDate(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("storeId") Long storeId
    );

    // FIX: thêm :storeId filter để STORE_MANAGER chỉ thấy chi nhánh của mình
    @Query(value = """
            SELECT s.store_id    AS storeId,
                   s.name        AS storeName,
                   SUM(o.total_amount) AS revenue
            FROM orders o
            JOIN stores s ON o.store_id = s.store_id
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED', 'REFUNDED')
              AND (:storeId IS NULL OR o.store_id = :storeId)
            GROUP BY s.store_id, s.name
            ORDER BY revenue DESC
            LIMIT :limitVal
            """, nativeQuery = true)
    List<Object[]> findRevenueGroupedByStore(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("storeId") Long storeId,
            @Param("limitVal") int limitVal
    );

    @Query("""
            SELECT o.status, COUNT(o)
            FROM Order o
            WHERE o.orderedAt BETWEEN :start AND :end
              AND (:storeId IS NULL OR o.store.id = :storeId)
            GROUP BY o.status
            """)
    List<Object[]> countOrderByStatus(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("storeId") Long storeId
    );

    @Query("""
            SELECT o
            FROM Order o
            JOIN FETCH o.store s
            JOIN FETCH o.user u
            WHERE o.orderedAt BETWEEN :start AND :end
              AND (:storeId IS NULL OR s.id = :storeId)
            ORDER BY o.orderedAt
            """)
    List<Order> findOrdersForExport(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("storeId") Long storeId
    );

    /**
     * Revenue rows nhóm theo DATE và store_id (mode=day).
     * Trả Object[]: [0]=java.sql.Date(dt), [1]=Long(storeId), [2]=BigDecimal(revenue)
     *
     * storeIds = null → tất cả chi nhánh.
     * Dùng Spring Data @Param với collection — JPA xử lý IN (:storeIds).
     */
    @Query(value = """
            SELECT DATE(o.ordered_at)   AS dt,
                   o.store_id,
                   SUM(o.total_amount)  AS revenue
            FROM orders o
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
              AND (:storeIds IS NULL OR o.store_id IN (:storeIds))
            GROUP BY DATE(o.ordered_at), o.store_id
            ORDER BY DATE(o.ordered_at)
            """,
            nativeQuery = true)
    List<Object[]> findRevenueRowsByDay(
            @Param("start")    LocalDateTime start,
            @Param("end")      LocalDateTime end,
            @Param("storeIds") List<Long> storeIds
    );

    // ══════════════════════════════════════════════════════════════════════
    // REVENUE PAGE — Series by MONTH + store
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Revenue rows nhóm theo YEAR-MONTH và store_id (mode=month).
     * Trả Object[]: [0]=String("2026-03"), [1]=Long(storeId), [2]=BigDecimal(revenue)
     */
    @Query(value = """
            SELECT DATE_FORMAT(o.ordered_at, '%Y-%m') AS dt,
                   o.store_id,
                   SUM(o.total_amount)                AS revenue
            FROM orders o
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
              AND (:storeIds IS NULL OR o.store_id IN (:storeIds))
            GROUP BY DATE_FORMAT(o.ordered_at, '%Y-%m'), o.store_id
            ORDER BY dt
            """,
            nativeQuery = true)
    List<Object[]> findRevenueRowsByMonth(
            @Param("start")    LocalDateTime start,
            @Param("end")      LocalDateTime end,
            @Param("storeIds") List<Long> storeIds
    );

    // ══════════════════════════════════════════════════════════════════════
    // REVENUE PAGE — Series by YEAR + store
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Revenue rows nhóm theo YEAR và store_id (mode=year).
     * Trả Object[]: [0]=Integer(year), [1]=Long(storeId), [2]=BigDecimal(revenue)
     */
    @Query(value = """
            SELECT YEAR(o.ordered_at)  AS dt,
                   o.store_id,
                   SUM(o.total_amount) AS revenue
            FROM orders o
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
              AND (:storeIds IS NULL OR o.store_id IN (:storeIds))
            GROUP BY YEAR(o.ordered_at), o.store_id
            ORDER BY dt
            """,
            nativeQuery = true)
    List<Object[]> findRevenueRowsByYear(
            @Param("start")    LocalDateTime start,
            @Param("end")      LocalDateTime end,
            @Param("storeIds") List<Long> storeIds
    );

    // ══════════════════════════════════════════════════════════════════════
    // REVENUE PAGE — Branch totals (top N)
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Tổng doanh thu per branch trong khoảng, sắp xếp giảm dần.
     * Trả Object[]: [0]=Long(storeId), [1]=String(storeName), [2]=BigDecimal(revenue)
     */
    @Query(value = """
            SELECT o.store_id,
                   s.name              AS storeName,
                   SUM(o.total_amount) AS revenue
            FROM orders o
            JOIN stores s ON o.store_id = s.store_id
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
            GROUP BY o.store_id, s.name
            ORDER BY revenue DESC
            LIMIT :limitVal
            """,
            nativeQuery = true)
    List<Object[]> findBranchRevenueSum(
            @Param("start")    LocalDateTime start,
            @Param("end")      LocalDateTime end,
            @Param("limitVal") int limitVal
    );

    // ══════════════════════════════════════════════════════════════════════
    // REVENUE PAGE — Branch comparison (2 kỳ trong 1 query)
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Doanh thu kỳ hiện tại và kỳ trước cho mỗi chi nhánh — 1 query CASE WHEN.
     * Trả Object[]:
     *   [0]=Long(storeId), [1]=String(storeName),
     *   [2]=BigDecimal(curRevenue), [3]=BigDecimal(prevRevenue)
     * Service tính growthPercent và sharePercent.
     */
    @Query(value = """
            SELECT s.store_id,
                   s.name AS storeName,
                   SUM(CASE WHEN o.ordered_at BETWEEN :curStart  AND :curEnd
                            THEN o.total_amount ELSE 0 END) AS cur_revenue,
                   SUM(CASE WHEN o.ordered_at BETWEEN :prevStart AND :prevEnd
                            THEN o.total_amount ELSE 0 END) AS prev_revenue
            FROM orders o
            JOIN stores s ON o.store_id = s.store_id
            WHERE o.ordered_at BETWEEN :prevStart AND :curEnd
              AND o.status NOT IN ('CANCELLED','REFUNDED')
            GROUP BY s.store_id, s.name
            """,
            nativeQuery = true)
    List<Object[]> findBranchRevenueForTwoPeriods(
            @Param("curStart")  LocalDateTime curStart,
            @Param("curEnd")    LocalDateTime curEnd,
            @Param("prevStart") LocalDateTime prevStart,
            @Param("prevEnd")   LocalDateTime prevEnd
    );

    // ══════════════════════════════════════════════════════════════════════
    // REVENUE PAGE — Yearly revenue
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Tổng doanh thu từng năm — YearlyBarChart.
     * Trả Object[]: [0]=Integer(year), [1]=BigDecimal(revenue)
     */
    @Query(value = """
            SELECT YEAR(o.ordered_at)  AS y,
                   SUM(o.total_amount) AS revenue
            FROM orders o
            WHERE YEAR(o.ordered_at) BETWEEN :startYear AND :endYear
              AND o.status NOT IN ('CANCELLED','REFUNDED')
            GROUP BY YEAR(o.ordered_at)
            ORDER BY y
            """,
            nativeQuery = true)
    List<Object[]> findYearlyRevenue(
            @Param("startYear") int startYear,
            @Param("endYear")   int endYear
    );

    // ══════════════════════════════════════════════════════════════════════
    // REVENUE PAGE — Tổng đơn và AOV (KPI cards)
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Đếm đơn hợp lệ trong khoảng — dùng tính AOV (Average Order Value).
     */
    @Query("""
            SELECT COUNT(o)
            FROM Order o
            WHERE o.orderedAt BETWEEN :start AND :end
              AND o.status NOT IN (
                  com.laptopshop.domain.order.enums.OrderStatus.CANCELLED,
                  com.laptopshop.domain.order.enums.OrderStatus.REFUNDED
              )
              AND (:storeId IS NULL OR o.store.id = :storeId)
            """)
    long countValidOrders(
            @Param("start")   LocalDateTime start,
            @Param("end")     LocalDateTime end,
            @Param("storeId") Long storeId
    );

    /**
     * Tổng doanh thu hợp lệ — tái dùng cho KPI cards Revenue page.
     * (Giống sumTotalAmountByDateRangeAndStore ở Dashboard nhưng expose riêng để rõ intent)
     */
    @Query("""
            SELECT COALESCE(SUM(o.totalAmount), 0)
            FROM Order o
            WHERE o.orderedAt BETWEEN :start AND :end
              AND o.status NOT IN (
                  com.laptopshop.domain.order.enums.OrderStatus.CANCELLED,
                  com.laptopshop.domain.order.enums.OrderStatus.REFUNDED
              )
              AND (:storeId IS NULL OR o.store.id = :storeId)
            """)
    BigDecimal sumValidRevenue(
            @Param("start")   LocalDateTime start,
            @Param("end")     LocalDateTime end,
            @Param("storeId") Long storeId
    );

    /**
     * Xuất danh sách đơn không phân trang cho export XLSX.
     * Có @Query đầy đủ — sửa lỗi compile của phiên bản trước.
     */
    @Query("""
            SELECT o FROM Order o
            JOIN FETCH o.user u
            JOIN FETCH o.store s
            LEFT JOIN FETCH o.payment p
            LEFT JOIN FETCH o.items oi
            LEFT JOIN FETCH oi.product
            WHERE (:q IS NULL
                   OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(u.fullName)  LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:status  IS NULL OR CAST(o.status AS string) = :status)
              AND (:storeId IS NULL OR s.id = :storeId)
              AND (:from    IS NULL OR o.orderedAt >= :from)
              AND (:to      IS NULL OR o.orderedAt <= :to)
            ORDER BY o.orderedAt DESC
            """)
    List<Order> findForExport(
            @Param("q")       String q,
            @Param("status")  String status,
            @Param("storeId") Long storeId,
            @Param("from")    LocalDateTime from,
            @Param("to")      LocalDateTime to
    );

    // ══════════════════════════════════════════════════════════════════════
    // CUSTOMER — Lịch sử đơn hàng phân trang (CustomerDetail)
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Đơn hàng của 1 khách, kèm LEFT JOIN payment để lấy method.
     * Trả Object[]:
     *   [0] String  orderCode
     *   [1] BigDecimal totalAmount
     *   [2] String  paymentMethod  (nullable)
     *   [3] String  status
     *   [4] LocalDateTime orderedAt
     */
    @Query(value = """
            SELECT o.order_code,
                   o.total_amount,
                   p.method       AS payment_method,
                   o.status,
                   o.ordered_at
            FROM orders o
            LEFT JOIN payments p ON o.order_id = p.order_id
            WHERE o.user_id = :userId
            ORDER BY o.ordered_at DESC
            """,
            countQuery = "SELECT COUNT(*) FROM orders WHERE user_id = :userId",
            nativeQuery = true)
    Page<Object[]> findOrderSummariesByUserId(
            @Param("userId") Long userId,
            Pageable pageable
    );

    // ══════════════════════════════════════════════════════════════════════
    // CUSTOMER — Tổng chi tiêu + số đơn của 1 khách (CustomerDetail stats)
    // ══════════════════════════════════════════════════════════════════════

    @Query("""
            SELECT COALESCE(SUM(o.totalAmount), 0)
            FROM Order o
            WHERE o.user.id = :userId
              AND o.status NOT IN (
                  com.laptopshop.domain.order.enums.OrderStatus.CANCELLED,
                  com.laptopshop.domain.order.enums.OrderStatus.REFUNDED
              )
            """)
    BigDecimal sumTotalSpentByUser(@Param("userId") Long userId);

    @Query("""
            SELECT COUNT(o)
            FROM Order o
            WHERE o.user.id = :userId
              AND o.status NOT IN (
                  com.laptopshop.domain.order.enums.OrderStatus.CANCELLED,
                  com.laptopshop.domain.order.enums.OrderStatus.REFUNDED
              )
            """)
    long countValidOrdersByUser(@Param("userId") Long userId);

    // ══════════════════════════════════════════════════════════════════════
    // CUSTOMER EXPORT — Lấy danh sách đầy đủ để sinh Excel
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Aggregate list: mỗi user kèm tổng đơn + tổng chi tiêu.
     * Trả Object[]:
     *   [0] Long    userId
     *   [1] String  fullName
     *   [2] String  email
     *   [3] String  phone
     *   [4] String  status
     *   [5] LocalDateTime createdAt
     *   [6] Long    orderCount
     *   [7] BigDecimal totalSpent
     */
    @Query(value = """
            SELECT u.user_id,
                   u.full_name,
                   u.email,
                   u.phone,
                   u.status,
                   u.created_at,
                   COUNT(o.order_id)    AS order_count,
                   SUM(CASE WHEN o.status NOT IN ('CANCELLED','REFUNDED')
                            THEN o.total_amount ELSE 0 END) AS total_spent
            FROM users u
            LEFT JOIN orders o ON u.user_id = o.user_id
            WHERE (:search IS NULL
                   OR u.full_name LIKE CONCAT('%',:search,'%')
                   OR u.email     LIKE CONCAT('%',:search,'%')
                   OR u.phone     LIKE CONCAT('%',:search,'%'))
              AND (:status IS NULL OR u.status = :status)
            GROUP BY u.user_id, u.full_name, u.email, u.phone, u.status, u.created_at
            ORDER BY total_spent DESC
            """,
            nativeQuery = true)
    List<Object[]> findCustomerAggregatesForExport(
            @Param("search") String search,
            @Param("status") String status
    );

    // ORDER
    /**
     * Tìm kiếm đơn hàng với nhiều bộ lọc (JPQL — tận dụng entity relations).
     * :q      → tìm theo orderCode hoặc tên khách hàng (nullable → bỏ qua)
     * :status → lọc theo DB status string (nullable → bỏ qua)
     * :storeId→ lọc theo chi nhánh (nullable → bỏ qua)
     * :from / :to → khoảng thời gian đặt hàng (nullable → bỏ qua)
     */
    @Query(
            value = """
            SELECT o FROM Order o
            JOIN FETCH o.user u
            JOIN FETCH o.store s
            LEFT JOIN FETCH o.payment p
            WHERE (:q IS NULL
                   OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(u.fullName)  LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:status  IS NULL OR CAST(o.status AS string) = :status)
              AND (:storeId IS NULL OR s.id = :storeId)
              AND (:from    IS NULL OR o.orderedAt >= :from)
              AND (:to      IS NULL OR o.orderedAt <= :to)
            ORDER BY o.orderedAt DESC
            """,
            countQuery = """
            SELECT COUNT(o) FROM Order o
            JOIN o.user u
            JOIN o.store s
            WHERE (:q IS NULL
                   OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(u.fullName)  LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:status  IS NULL OR CAST(o.status AS string) = :status)
              AND (:storeId IS NULL OR s.id = :storeId)
              AND (:from    IS NULL OR o.orderedAt >= :from)
              AND (:to      IS NULL OR o.orderedAt <= :to)
            """)
    Page<Order> searchOrders(
            @Param("q")       String q,
            @Param("status")  String status,
            @Param("storeId") Long storeId,
            @Param("from")    LocalDateTime from,
            @Param("to")      LocalDateTime to,
            Pageable pageable
    );

    /**
     * Lấy chi tiết đơn hàng kèm tất cả relations cần thiết cho OrderDetailDto.
     * Dùng riêng cho getOrderDetail() để tránh N+1.
     */
    @Query("""
            SELECT o FROM Order o
            JOIN FETCH o.user u
            JOIN FETCH o.store s
            LEFT JOIN FETCH o.address a
            LEFT JOIN FETCH o.payment p
            LEFT JOIN FETCH o.shipment sh
            WHERE o.id = :orderId
            """)
    Optional<Order> findDetailById(@Param("orderId") Long orderId);

    /**
     * Thống kê số đơn theo trạng thái trong khoảng thời gian.
     * Trả về Object[]: [0]=status (String), [1]=count (Long), [2]=totalAmount (BigDecimal)
     */
    @Query(value = """
            SELECT o.status,
                   COUNT(*)        AS cnt,
                   SUM(o.total_amount) AS revenue
            FROM orders o
            WHERE (:storeId IS NULL OR o.store_id = :storeId)
              AND o.ordered_at BETWEEN :from AND :to
            GROUP BY o.status
            """, nativeQuery = true)
    List<Object[]> aggregateOrderStats(
            @Param("from")    LocalDateTime from,
            @Param("to")      LocalDateTime to,
            @Param("storeId") Long storeId
    );

    /**
     * Tìm đơn hàng theo orderCode — dùng khi frontend truyền orderCode.
     */
    Optional<Order> findByOrderCode(String orderCode);

    /**
     * Export: lấy danh sách đơn không phân trang (dùng cho xuất XLSX).
     * Dùng cùng bộ filter như searchOrders.
     */
    @Query("""
            SELECT o FROM Order o
            JOIN FETCH o.user u
            JOIN FETCH o.store s
            LEFT JOIN FETCH o.payment p
            WHERE (:q IS NULL
                   OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(u.fullName)  LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:status  IS NULL OR CAST(o.status AS string) = :status)
              AND (:storeId IS NULL OR s.id = :storeId)
              AND (:from    IS NULL OR o.orderedAt >= :from)
              AND (:to      IS NULL OR o.orderedAt <= :to)
            ORDER BY o.orderedAt DESC
            """)
    List<Order> findOrderForExport(
            @Param("q")       String q,
            @Param("status")  String status,
            @Param("storeId") Long storeId,
            @Param("from")    LocalDateTime from,
            @Param("to")      LocalDateTime to
    );

    /**
     * Danh sách đơn hàng của một khách hàng, hỗ trợ filter status + date range.
     */
    @Query(
            value = """
            SELECT o FROM Order o
            LEFT JOIN FETCH o.payment p
            WHERE o.user.id = :userId
              AND (:status IS NULL OR CAST(o.status AS string) = :status)
              AND (:from   IS NULL OR o.orderedAt >= :from)
              AND (:to     IS NULL OR o.orderedAt <= :to)
            ORDER BY o.orderedAt DESC
            """,
            countQuery = """
            SELECT COUNT(o) FROM Order o
            WHERE o.user.id = :userId
              AND (:status IS NULL OR CAST(o.status AS string) = :status)
              AND (:from   IS NULL OR o.orderedAt >= :from)
              AND (:to     IS NULL OR o.orderedAt <= :to)
            """)
    Page<Order> findByUserIdWithFilters(
            @Param("userId") Long userId,
            @Param("status") String status,
            @Param("from")   LocalDateTime from,
            @Param("to")     LocalDateTime to,
            Pageable pageable
    );

    // REFUND PAGE

    /**
     * FIX: Thêm @Query annotation — method này trước đó không có @Query
     * nên Spring Data JPA không thể tự derive query từ tên method phức tạp này.
     */
    @Query("""
            SELECT o FROM Order o
            JOIN FETCH o.user u
            JOIN FETCH o.store s
            LEFT JOIN FETCH o.payment p
            WHERE (:q IS NULL
                   OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(u.fullName)  LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:status  IS NULL OR CAST(o.status AS string) = :status)
              AND (:storeId IS NULL OR s.id = :storeId)
              AND (:from    IS NULL OR o.orderedAt >= :from)
              AND (:to      IS NULL OR o.orderedAt <= :to)
            ORDER BY o.orderedAt DESC
            """)
    List<Order> findForRefundExport(
            @Param("q")       String q,
            @Param("status")  String status,
            @Param("storeId") Long storeId,
            @Param("from")    LocalDateTime from,
            @Param("to")      LocalDateTime to
    );
}
