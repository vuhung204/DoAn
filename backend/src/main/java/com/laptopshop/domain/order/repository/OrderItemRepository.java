package com.laptopshop.domain.order.repository;

import com.laptopshop.domain.order.entity.OrderItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    /**
     * Lấy tất cả items của một đơn hàng, kèm product info để tránh N+1.
     */
    @Query("""
            SELECT oi FROM OrderItem oi
            JOIN FETCH oi.product p
            WHERE oi.order.id = :orderId
            """)
    List<OrderItem> findByOrderIdWithProduct(@Param("orderId") Long orderId);

    /**
     * Lấy items theo trang (dùng cho endpoint GET /admin/orders/{id}/items).
     */
    @Query(value = """
            SELECT oi FROM OrderItem oi
            JOIN FETCH oi.product p
            WHERE oi.order.id = :orderId
            """,
            countQuery = "SELECT COUNT(oi) FROM OrderItem oi WHERE oi.order.id = :orderId")
    Page<OrderItem> findPageByOrderId(@Param("orderId") Long orderId, Pageable pageable);

    /** Đếm số lượng item của đơn hàng (dùng cho OrderListDto.itemCount). */
    @Query("SELECT COUNT(oi) FROM OrderItem oi WHERE oi.order.id = :orderId")
    int countByOrderId(@Param("orderId") Long orderId);

    // ══════════════════════════════════════════════════════════════════════
    // Top products — aggregate sales by product
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Tổng hợp doanh số / doanh thu / rating / reviews theo sản phẩm.
     * Trả Object[]:
     *   [0] Long    productId
     *   [1] String  sku
     *   [2] String  name
     *   [3] Long    unitsSold
     *   [4] BigDecimal revenue (VND)
     *   [5] BigDecimal avgRating  (null nếu chưa có review)
     *   [6] Long    reviewCount
     *
     * storeIds  = null → tất cả chi nhánh
     * categoryIds = null → tất cả danh mục
     */
//    @Query(value = """
//            SELECT oi.product_id,
//                   p.sku,
//                   p.name,
//                   SUM(oi.quantity)                AS units_sold,
//                   SUM(oi.total_price)             AS revenue,
//                   AVG(r.rating)                   AS avg_rating,
//                   COUNT(DISTINCT r.review_id)     AS review_count
//            FROM order_items oi
//            JOIN orders  o ON oi.order_id   = o.order_id
//            JOIN products p ON oi.product_id = p.product_id
//            LEFT JOIN reviews r ON p.product_id = r.product_id AND r.is_visible = 1
//            WHERE o.ordered_at BETWEEN :start AND :end
//              AND o.status NOT IN ('CANCELLED','REFUNDED')
//              AND (:storeIds    IS NULL OR o.store_id       IN (:storeIds))
//              AND (:categoryIds IS NULL OR p.category_id   IN (:categoryIds))
//              AND p.is_active = 1
//            GROUP BY oi.product_id, p.sku, p.name
//            ORDER BY revenue DESC
//            LIMIT :limitVal
//            """,
//            nativeQuery = true)
//    List<Object[]> aggregateSalesByProduct(
//            @Param("start")       LocalDateTime start,
//            @Param("end")         LocalDateTime end,
//            @Param("storeIds")    List<Long> storeIds,
//            @Param("categoryIds") List<Long> categoryIds,
//            @Param("limitVal")    int limitVal
//    );

    // ══════════════════════════════════════════════════════════════════════
    // Overstock — lấy doanh số của danh sách sản phẩm trong cửa sổ thời gian
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Tổng số lượng bán per product trong khoảng — dùng tính estMonthlySales.
     * Trả Object[]: [0]=Long(productId), [1]=Long(unitsSold)
     *
     * productIds = null → tất cả sản phẩm trong khoảng.
     */
//    @Query(value = """
//            SELECT oi.product_id,
//                   SUM(oi.quantity) AS units_sold
//            FROM order_items oi
//            JOIN orders o ON oi.order_id = o.order_id
//            WHERE o.ordered_at BETWEEN :start AND :end
//              AND o.status NOT IN ('CANCELLED','REFUNDED')
//              AND (:storeIds   IS NULL OR o.store_id    IN (:storeIds))
//              AND (:productIds IS NULL OR oi.product_id IN (:productIds))
//            GROUP BY oi.product_id
//            """,
//            nativeQuery = true)
//    List<Object[]> sumUnitsByProductForPeriod(
//            @Param("start")      LocalDateTime start,
//            @Param("end")        LocalDateTime end,
//            @Param("storeIds")   List<Long> storeIds,
//            @Param("productIds") List<Long> productIds
//    );

    // ══════════════════════════════════════════════════════════════════════
    // Dead stock — lấy product_id có bán trong khoảng (để loại trừ)
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Tập hợp product_id đã bán ít nhất 1 đơn trong lookback period.
     * Service dùng để tìm deadstock = có tồn kho nhưng KHÔNG nằm trong set này.
     */
//    @Query(value = """
//            SELECT DISTINCT oi.product_id
//            FROM order_items oi
//            JOIN orders o ON oi.order_id = o.order_id
//            WHERE o.ordered_at BETWEEN :start AND :end
//              AND o.status NOT IN ('CANCELLED','REFUNDED')
//              AND (:storeIds IS NULL OR o.store_id IN (:storeIds))
//            """,
//            nativeQuery = true)
//    List<Long> findSoldProductIds(
//            @Param("start")    LocalDateTime start,
//            @Param("end")      LocalDateTime end,
//            @Param("storeIds") List<Long> storeIds
//    );

    // ══════════════════════════════════════════════════════════════════════
    // Dead stock — lần bán cuối của từng sản phẩm
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Lần bán cuối (MAX ordered_at) per product — dùng để hiển thị lastSoldAt.
     * Trả Object[]: [0]=Long(productId), [1]=LocalDateTime(lastSoldAt)
     */
//    @Query(value = """
//            SELECT oi.product_id,
//                   MAX(o.ordered_at) AS last_sold_at
//            FROM order_items oi
//            JOIN orders o ON oi.order_id = o.order_id
//            WHERE o.status NOT IN ('CANCELLED','REFUNDED')
//              AND (:storeIds   IS NULL OR o.store_id    IN (:storeIds))
//              AND (:productIds IS NULL OR oi.product_id IN (:productIds))
//            GROUP BY oi.product_id
//            """,
//            nativeQuery = true)
//    List<Object[]> findLastSoldAtByProducts(
//            @Param("storeIds")   List<Long> storeIds,
//            @Param("productIds") List<Long> productIds
//    );

    // ══════════════════════════════════════════════════════════════════════
    // Category breakdown
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Doanh thu / số lượng bán theo danh mục.
     * Trả Object[]:
     *   [0] Long    categoryId
     *   [1] String  categoryName
     *   [2] BigDecimal revenue (VND)
     *   [3] Long    unitsSold
     */
//    @Query(value = """
//            SELECT p.category_id,
//                   c.name              AS category_name,
//                   SUM(oi.total_price) AS revenue,
//                   SUM(oi.quantity)    AS units_sold
//            FROM order_items oi
//            JOIN products   p ON oi.product_id  = p.product_id
//            JOIN categories c ON p.category_id  = c.category_id
//            JOIN orders     o ON oi.order_id     = o.order_id
//            WHERE o.ordered_at BETWEEN :start AND :end
//              AND o.status NOT IN ('CANCELLED','REFUNDED')
//              AND (:storeId IS NULL OR o.store_id = :storeId)
//              AND p.is_active = 1
//            GROUP BY p.category_id, c.name
//            ORDER BY revenue DESC
//            """,
//            nativeQuery = true)
//    List<Object[]> aggregateByCategory(
//            @Param("start")   LocalDateTime start,
//            @Param("end")     LocalDateTime end,
//            @Param("storeId") Long storeId
//    );

    // ══════════════════════════════════════════════════════════════════════
    // Stat cards — tổng doanh thu & số lượng bán trong kỳ
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Tổng doanh thu hợp lệ trong kỳ — dùng cho stat card "Doanh thu kỳ".
     */
//    @Query(value = """
//            SELECT COALESCE(SUM(oi.total_price), 0)
//            FROM order_items oi
//            JOIN orders o ON oi.order_id = o.order_id
//            WHERE o.ordered_at BETWEEN :start AND :end
//              AND o.status NOT IN ('CANCELLED','REFUNDED')
//              AND (:storeId IS NULL OR o.store_id = :storeId)
//            """,
//            nativeQuery = true)
//    java.math.BigDecimal sumRevenueForPeriod(
//            @Param("start") LocalDateTime start,
//            @Param("end") LocalDateTime end,
//            @Param("storeId") Long storeId
//    );

    /**
     * Tổng số lượng sản phẩm đã bán — dùng cho stat card "Sản phẩm đã bán".
     */
//    @Query(value = """
//            SELECT COALESCE(SUM(oi.quantity), 0)
//            FROM order_items oi
//            JOIN orders o ON oi.order_id = o.order_id
//            WHERE o.ordered_at BETWEEN :start AND :end
//              AND o.status NOT IN ('CANCELLED','REFUNDED')
//              AND (:storeId IS NULL OR o.store_id = :storeId)
//            """,
//            nativeQuery = true)
//    Long sumUnitsSoldForPeriod(
//            @Param("start") LocalDateTime start,
//            @Param("end") LocalDateTime end,
//            @Param("storeId") Long storeId
//    );

    // ══════════════════════════════════════════════════════════════════════
    // Top products
    // ══════════════════════════════════════════════════════════════════════

    /**
     * FIX: Tách thành 2 query — có filter storeIds và không filter.
     * MySQL không hỗ trợ (:list IS NULL OR col IN (:list)) khi list có nhiều phần tử.
     */
    @Query(value = """
            SELECT oi.product_id,
                   p.sku,
                   p.name,
                   SUM(oi.quantity)                AS units_sold,
                   SUM(oi.total_price)             AS revenue,
                   AVG(r.rating)                   AS avg_rating,
                   COUNT(DISTINCT r.review_id)     AS review_count
            FROM order_items oi
            JOIN orders   o ON oi.order_id   = o.order_id
            JOIN products p ON oi.product_id = p.product_id
            LEFT JOIN reviews r ON p.product_id = r.product_id AND r.is_visible = 1
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
              AND p.is_active = 1
            GROUP BY oi.product_id, p.sku, p.name
            ORDER BY revenue DESC
            LIMIT :limitVal
            """, nativeQuery = true)
    List<Object[]> aggregateSalesByProductAllStores(
            @Param("start")    LocalDateTime start,
            @Param("end")      LocalDateTime end,
            @Param("limitVal") int limitVal
    );

    @Query(value = """
            SELECT oi.product_id,
                   p.sku,
                   p.name,
                   SUM(oi.quantity)                AS units_sold,
                   SUM(oi.total_price)             AS revenue,
                   AVG(r.rating)                   AS avg_rating,
                   COUNT(DISTINCT r.review_id)     AS review_count
            FROM order_items oi
            JOIN orders   o ON oi.order_id   = o.order_id
            JOIN products p ON oi.product_id = p.product_id
            LEFT JOIN reviews r ON p.product_id = r.product_id AND r.is_visible = 1
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
              AND o.store_id IN (:storeIds)
              AND p.is_active = 1
            GROUP BY oi.product_id, p.sku, p.name
            ORDER BY revenue DESC
            LIMIT :limitVal
            """, nativeQuery = true)
    List<Object[]> aggregateSalesByProductWithStores(
            @Param("start")    LocalDateTime start,
            @Param("end")      LocalDateTime end,
            @Param("storeIds") List<Long> storeIds,
            @Param("limitVal") int limitVal
    );

    // ── Default method để service gọi một chỗ ────────────────────────────
    default List<Object[]> aggregateSalesByProduct(
            LocalDateTime start, LocalDateTime end,
            List<Long> storeIds, List<Long> categoryIds, int limitVal) {
        // categoryIds filter chưa implement trong query — ignore for now
        if (storeIds == null || storeIds.isEmpty()) {
            return aggregateSalesByProductAllStores(start, end, limitVal);
        }
        return aggregateSalesByProductWithStores(start, end, storeIds, limitVal);
    }

    // ══════════════════════════════════════════════════════════════════════
    // Overstock — units by product
    // ══════════════════════════════════════════════════════════════════════

    @Query(value = """
            SELECT oi.product_id,
                   SUM(oi.quantity) AS units_sold
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
              AND oi.product_id IN (:productIds)
            GROUP BY oi.product_id
            """, nativeQuery = true)
    List<Object[]> sumUnitsByProductAllStores(
            @Param("start")      LocalDateTime start,
            @Param("end")        LocalDateTime end,
            @Param("productIds") List<Long> productIds
    );

    @Query(value = """
            SELECT oi.product_id,
                   SUM(oi.quantity) AS units_sold
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
              AND o.store_id IN (:storeIds)
              AND oi.product_id IN (:productIds)
            GROUP BY oi.product_id
            """, nativeQuery = true)
    List<Object[]> sumUnitsByProductWithStores(
            @Param("start")      LocalDateTime start,
            @Param("end")        LocalDateTime end,
            @Param("storeIds")   List<Long> storeIds,
            @Param("productIds") List<Long> productIds
    );

    default List<Object[]> sumUnitsByProductForPeriod(
            LocalDateTime start, LocalDateTime end,
            List<Long> storeIds, List<Long> productIds) {
        if (storeIds == null || storeIds.isEmpty()) {
            return sumUnitsByProductAllStores(start, end, productIds);
        }
        return sumUnitsByProductWithStores(start, end, storeIds, productIds);
    }

    // ══════════════════════════════════════════════════════════════════════
    // Dead stock — sold product ids
    // ══════════════════════════════════════════════════════════════════════

    @Query(value = """
            SELECT DISTINCT oi.product_id
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
            """, nativeQuery = true)
    List<Long> findSoldProductIdsAllStores(
            @Param("start") LocalDateTime start,
            @Param("end")   LocalDateTime end
    );

    @Query(value = """
            SELECT DISTINCT oi.product_id
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
              AND o.store_id IN (:storeIds)
            """, nativeQuery = true)
    List<Long> findSoldProductIdsWithStores(
            @Param("start")    LocalDateTime start,
            @Param("end")      LocalDateTime end,
            @Param("storeIds") List<Long> storeIds
    );

    default List<Long> findSoldProductIds(
            LocalDateTime start, LocalDateTime end, List<Long> storeIds) {
        if (storeIds == null || storeIds.isEmpty()) {
            return findSoldProductIdsAllStores(start, end);
        }
        return findSoldProductIdsWithStores(start, end, storeIds);
    }

    // ══════════════════════════════════════════════════════════════════════
    // Dead stock — last sold at
    // ══════════════════════════════════════════════════════════════════════

    @Query(value = """
            SELECT oi.product_id,
                   MAX(o.ordered_at) AS last_sold_at
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.status NOT IN ('CANCELLED','REFUNDED')
              AND oi.product_id IN (:productIds)
            GROUP BY oi.product_id
            """, nativeQuery = true)
    List<Object[]> findLastSoldAtAllStores(
            @Param("productIds") List<Long> productIds
    );

    @Query(value = """
            SELECT oi.product_id,
                   MAX(o.ordered_at) AS last_sold_at
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.status NOT IN ('CANCELLED','REFUNDED')
              AND o.store_id IN (:storeIds)
              AND oi.product_id IN (:productIds)
            GROUP BY oi.product_id
            """, nativeQuery = true)
    List<Object[]> findLastSoldAtWithStores(
            @Param("storeIds")   List<Long> storeIds,
            @Param("productIds") List<Long> productIds
    );

    default List<Object[]> findLastSoldAtByProducts(
            List<Long> storeIds, List<Long> productIds) {
        if (storeIds == null || storeIds.isEmpty()) {
            return findLastSoldAtAllStores(productIds);
        }
        return findLastSoldAtWithStores(storeIds, productIds);
    }

    // ══════════════════════════════════════════════════════════════════════
    // Category breakdown
    // ══════════════════════════════════════════════════════════════════════

    @Query(value = """
            SELECT p.category_id,
                   c.name              AS category_name,
                   SUM(oi.total_price) AS revenue,
                   SUM(oi.quantity)    AS units_sold
            FROM order_items oi
            JOIN products   p ON oi.product_id = p.product_id
            JOIN categories c ON p.category_id = c.category_id
            JOIN orders     o ON oi.order_id    = o.order_id
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
              AND p.is_active = 1
            GROUP BY p.category_id, c.name
            ORDER BY revenue DESC
            """, nativeQuery = true)
    List<Object[]> aggregateByCategoryAllStores(
            @Param("start") LocalDateTime start,
            @Param("end")   LocalDateTime end
    );

    @Query(value = """
            SELECT p.category_id,
                   c.name              AS category_name,
                   SUM(oi.total_price) AS revenue,
                   SUM(oi.quantity)    AS units_sold
            FROM order_items oi
            JOIN products   p ON oi.product_id  = p.product_id
            JOIN categories c ON p.category_id  = c.category_id
            JOIN orders     o ON oi.order_id     = o.order_id
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
              AND o.store_id = :storeId
              AND p.is_active = 1
            GROUP BY p.category_id, c.name
            ORDER BY revenue DESC
            """, nativeQuery = true)
    List<Object[]> aggregateByCategoryWithStore(
            @Param("start")   LocalDateTime start,
            @Param("end")     LocalDateTime end,
            @Param("storeId") Long storeId
    );

    default List<Object[]> aggregateByCategory(
            LocalDateTime start, LocalDateTime end, Long storeId) {
        if (storeId == null) {
            return aggregateByCategoryAllStores(start, end);
        }
        return aggregateByCategoryWithStore(start, end, storeId);
    }

    // ══════════════════════════════════════════════════════════════════════
    // Stat cards
    // ══════════════════════════════════════════════════════════════════════

    @Query(value = """
            SELECT COALESCE(SUM(oi.total_price), 0)
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
            """, nativeQuery = true)
    BigDecimal sumRevenueAllStores(
            @Param("start") LocalDateTime start,
            @Param("end")   LocalDateTime end
    );

    @Query(value = """
            SELECT COALESCE(SUM(oi.total_price), 0)
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
              AND o.store_id = :storeId
            """, nativeQuery = true)
    BigDecimal sumRevenueWithStore(
            @Param("start")   LocalDateTime start,
            @Param("end")     LocalDateTime end,
            @Param("storeId") Long storeId
    );

    default BigDecimal sumRevenueForPeriod(
            LocalDateTime start, LocalDateTime end, Long storeId) {
        if (storeId == null) return sumRevenueAllStores(start, end);
        return sumRevenueWithStore(start, end, storeId);
    }

    @Query(value = """
            SELECT COALESCE(SUM(oi.quantity), 0)
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
            """, nativeQuery = true)
    Long sumUnitsSoldAllStores(
            @Param("start") LocalDateTime start,
            @Param("end")   LocalDateTime end
    );

    @Query(value = """
            SELECT COALESCE(SUM(oi.quantity), 0)
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.ordered_at BETWEEN :start AND :end
              AND o.status NOT IN ('CANCELLED','REFUNDED')
              AND o.store_id = :storeId
            """, nativeQuery = true)
    Long sumUnitsSoldWithStore(
            @Param("start")   LocalDateTime start,
            @Param("end")     LocalDateTime end,
            @Param("storeId") Long storeId
    );

    default Long sumUnitsSoldForPeriod(
            LocalDateTime start, LocalDateTime end, Long storeId) {
        if (storeId == null) return sumUnitsSoldAllStores(start, end);
        return sumUnitsSoldWithStore(start, end, storeId);
    }

    /**
     * Fetch order items kèm product + brand + images trong 1 query.
     *
     * Tách riêng khỏi findDetailById() để tránh MultipleBagFetchException
     * (Hibernate không cho phép fetch nhiều collection cùng lúc trong 1 JPQL).
     *
     * Dùng trong OrderService.getOrderDetail().
     */
    @Query("""
            SELECT oi FROM OrderItem oi
            JOIN FETCH oi.product p
            LEFT JOIN FETCH p.brand
            LEFT JOIN FETCH p.images
            WHERE oi.order.id = :orderId
            """)
    List<OrderItem> findByOrderIdWithProductDetails(@Param("orderId") Long orderId);
}
