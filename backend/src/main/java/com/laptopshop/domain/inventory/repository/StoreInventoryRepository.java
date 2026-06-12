package com.laptopshop.domain.inventory.repository;

import com.laptopshop.domain.inventory.entity.StoreInventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreInventoryRepository extends JpaRepository<StoreInventory, Long> {

    @Query("SELECT COALESCE(SUM(si.quantity),0) FROM StoreInventory si WHERE si.product.id = :productId")
    Long totalQuantityByProductId(Long productId);

    Optional<StoreInventory> findByStoreIdAndProductId(Long storeId, Long productId);

    /**
     * Tăng/giảm tồn kho trực tiếp bằng SQL để tránh lost-update trong môi trường concurrent.
     * quantityDelta > 0 → nhập hàng, < 0 → xuất hàng.
     * Không cho phép quantity < 0.
     */
    @Modifying
    @Query(value = """
            UPDATE store_inventory
            SET quantity = quantity + :delta,
                updated_at = NOW()
            WHERE store_id = :storeId
              AND product_id = :productId
              AND quantity + :delta >= 0
            """, nativeQuery = true)
    int adjustQuantity(
            @Param("storeId")    Long storeId,
            @Param("productId")  Long productId,
            @Param("delta")      int delta
    );

    // ══════════════════════════════════════════════════════════════════════
    // Dashboard — low stock count
    // ══════════════════════════════════════════════════════════════════════

    @Query(value = """
            SELECT COUNT(*)
            FROM store_inventory si
            JOIN products p ON si.product_id = p.product_id
            JOIN stores   s ON si.store_id   = s.store_id
            WHERE si.quantity <= si.min_quantity
              AND p.is_active = 1
              AND s.is_active = 1
            """, nativeQuery = true)
    long countLowStockItemsAllStores();

    @Query(value = """
            SELECT COUNT(*)
            FROM store_inventory si
            JOIN products p ON si.product_id = p.product_id
            JOIN stores   s ON si.store_id   = s.store_id
            WHERE si.quantity <= si.min_quantity
              AND p.is_active = 1
              AND s.is_active = 1
              AND si.store_id = :storeId
            """, nativeQuery = true)
    long countLowStockItemsWithStore(@Param("storeId") Long storeId);

    default long countLowStockItems(Long storeId) {
        if (storeId == null) return countLowStockItemsAllStores();
        return countLowStockItemsWithStore(storeId);
    }

    // ══════════════════════════════════════════════════════════════════════
    // Dashboard — low stock paged list
    // ══════════════════════════════════════════════════════════════════════

    @Query(value = """
            SELECT si.product_id, p.sku, p.name AS productName,
                   si.store_id, s.name AS storeName,
                   si.quantity AS stock, si.min_quantity AS minQuantity
            FROM store_inventory si
            JOIN products p ON si.product_id = p.product_id
            JOIN stores   s ON si.store_id   = s.store_id
            WHERE si.quantity <= COALESCE(:threshold, si.min_quantity)
              AND p.is_active = 1
              AND s.is_active = 1
            ORDER BY (si.min_quantity - si.quantity) DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM store_inventory si
            JOIN products p ON si.product_id = p.product_id
            JOIN stores   s ON si.store_id   = s.store_id
            WHERE si.quantity <= COALESCE(:threshold, si.min_quantity)
              AND p.is_active = 1
              AND s.is_active = 1
            """, nativeQuery = true)
    Page<Object[]> findLowStockItemsAllStores(
            @Param("threshold") Integer threshold,
            Pageable pageable
    );

    @Query(value = """
            SELECT si.product_id, p.sku, p.name AS productName,
                   si.store_id, s.name AS storeName,
                   si.quantity AS stock, si.min_quantity AS minQuantity
            FROM store_inventory si
            JOIN products p ON si.product_id = p.product_id
            JOIN stores   s ON si.store_id   = s.store_id
            WHERE si.quantity <= COALESCE(:threshold, si.min_quantity)
              AND p.is_active = 1
              AND s.is_active = 1
              AND si.store_id = :storeId
            ORDER BY (si.min_quantity - si.quantity) DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM store_inventory si
            JOIN products p ON si.product_id = p.product_id
            JOIN stores   s ON si.store_id   = s.store_id
            WHERE si.quantity <= COALESCE(:threshold, si.min_quantity)
              AND p.is_active = 1
              AND s.is_active = 1
              AND si.store_id = :storeId
            """, nativeQuery = true)
    Page<Object[]> findLowStockItemsWithStore(
            @Param("storeId")   Long storeId,
            @Param("threshold") Integer threshold,
            Pageable pageable
    );

    default Page<Object[]> findLowStockItems(Long storeId, Integer threshold, Pageable pageable) {
        if (storeId == null) return findLowStockItemsAllStores(threshold, pageable);
        return findLowStockItemsWithStore(storeId, threshold, pageable);
    }

    // ══════════════════════════════════════════════════════════════════════
    // Dashboard — export inventory
    // ══════════════════════════════════════════════════════════════════════

    @Query("""
            SELECT si FROM StoreInventory si
            JOIN FETCH si.product p
            JOIN FETCH si.store s
            ORDER BY s.name, p.sku
            """)
    List<StoreInventory> findAllForExportAllStores();

    @Query("""
            SELECT si FROM StoreInventory si
            JOIN FETCH si.product p
            JOIN FETCH si.store s
            WHERE s.id = :storeId
            ORDER BY s.name, p.sku
            """)
    List<StoreInventory> findAllForExportWithStore(@Param("storeId") Long storeId);

    default List<StoreInventory> findAllForExport(Long storeId) {
        if (storeId == null) return findAllForExportAllStores();
        return findAllForExportWithStore(storeId);
    }

    // ══════════════════════════════════════════════════════════════════════
    // Product Report — overstock rows
    // ══════════════════════════════════════════════════════════════════════

    @Query(value = """
            SELECT si.product_id, p.sku, p.name AS product_name,
                   si.store_id, s.name AS store_name,
                   si.quantity,
                   COALESCE(p.sale_price, p.base_price) AS price
            FROM store_inventory si
            JOIN products p ON si.product_id = p.product_id
            JOIN stores   s ON si.store_id   = s.store_id
            WHERE si.quantity > 0
              AND p.is_active = 1
              AND s.is_active = 1
            ORDER BY si.quantity DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM store_inventory si
            JOIN products p ON si.product_id = p.product_id
            JOIN stores   s ON si.store_id   = s.store_id
            WHERE si.quantity > 0
              AND p.is_active = 1
              AND s.is_active = 1
            """, nativeQuery = true)
    Page<Object[]> findStockRowsForOverstockAllStores(Pageable pageable);

    @Query(value = """
            SELECT si.product_id, p.sku, p.name AS product_name,
                   si.store_id, s.name AS store_name,
                   si.quantity,
                   COALESCE(p.sale_price, p.base_price) AS price
            FROM store_inventory si
            JOIN products p ON si.product_id = p.product_id
            JOIN stores   s ON si.store_id   = s.store_id
            WHERE si.quantity > 0
              AND p.is_active = 1
              AND s.is_active = 1
              AND si.store_id IN (:storeIds)
            ORDER BY si.quantity DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM store_inventory si
            JOIN products p ON si.product_id = p.product_id
            JOIN stores   s ON si.store_id   = s.store_id
            WHERE si.quantity > 0
              AND p.is_active = 1
              AND s.is_active = 1
              AND si.store_id IN (:storeIds)
            """, nativeQuery = true)
    Page<Object[]> findStockRowsForOverstockWithStores(
            @Param("storeIds") List<Long> storeIds,
            Pageable pageable
    );

    default Page<Object[]> findStockRowsForOverstock(List<Long> storeIds, Pageable pageable) {
        if (storeIds == null || storeIds.isEmpty()) return findStockRowsForOverstockAllStores(pageable);
        return findStockRowsForOverstockWithStores(storeIds, pageable);
    }

    // ══════════════════════════════════════════════════════════════════════
    // Product Report — dead stock rows
    // ══════════════════════════════════════════════════════════════════════

    @Query(value = """
            SELECT si.product_id, p.sku, p.name AS product_name,
                   si.store_id, s.name AS store_name,
                   si.quantity,
                   COALESCE(p.sale_price, p.base_price) AS price
            FROM store_inventory si
            JOIN products p ON si.product_id = p.product_id
            JOIN stores   s ON si.store_id   = s.store_id
            WHERE si.quantity > 0
              AND p.is_active = 1
              AND s.is_active = 1
            ORDER BY si.quantity DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM store_inventory si
            JOIN products p ON si.product_id = p.product_id
            JOIN stores   s ON si.store_id   = s.store_id
            WHERE si.quantity > 0
              AND p.is_active = 1
              AND s.is_active = 1
            """, nativeQuery = true)
    Page<Object[]> findDeadStockRowsAllStores(Pageable pageable);

    @Query(value = """
            SELECT si.product_id, p.sku, p.name AS product_name,
                   si.store_id, s.name AS store_name,
                   si.quantity,
                   COALESCE(p.sale_price, p.base_price) AS price
            FROM store_inventory si
            JOIN products p ON si.product_id = p.product_id
            JOIN stores   s ON si.store_id   = s.store_id
            WHERE si.quantity > 0
              AND p.is_active = 1
              AND s.is_active = 1
              AND si.store_id IN (:storeIds)
            ORDER BY si.quantity DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM store_inventory si
            JOIN products p ON si.product_id = p.product_id
            JOIN stores   s ON si.store_id   = s.store_id
            WHERE si.quantity > 0
              AND p.is_active = 1
              AND s.is_active = 1
              AND si.store_id IN (:storeIds)
            """, nativeQuery = true)
    Page<Object[]> findDeadStockRowsWithStores(
            @Param("storeIds") List<Long> storeIds,
            Pageable pageable
    );

    // soldIds filter xử lý ở service layer (post-filter) thay vì trong query
    // để tránh lỗi MySQL với NOT IN + nullable list
    default Page<Object[]> findDeadStockRows(
            List<Long> storeIds, List<Long> soldProductIds, Pageable pageable) {
        if (storeIds == null || storeIds.isEmpty()) return findDeadStockRowsAllStores(pageable);
        return findDeadStockRowsWithStores(storeIds, pageable);
    }

    // ══════════════════════════════════════════════════════════════════════
    // Product Report — low stock count (distinct products)
    // ══════════════════════════════════════════════════════════════════════

    @Query(value = """
            SELECT COUNT(DISTINCT si.product_id)
            FROM store_inventory si
            JOIN products p ON si.product_id = p.product_id
            WHERE si.quantity <= si.min_quantity
              AND p.is_active = 1
            """, nativeQuery = true)
    long countLowStockProductsAllStores();

    @Query(value = """
            SELECT COUNT(DISTINCT si.product_id)
            FROM store_inventory si
            JOIN products p ON si.product_id = p.product_id
            WHERE si.quantity <= si.min_quantity
              AND p.is_active = 1
              AND si.store_id = :storeId
            """, nativeQuery = true)
    long countLowStockProductsWithStore(@Param("storeId") Long storeId);

    default long countLowStockProducts(Long storeId) {
        if (storeId == null) return countLowStockProductsAllStores();
        return countLowStockProductsWithStore(storeId);
    }

    // ══════════════════════════════════════════════════════════════════════
    // PRODUCT MGMT — Tổng tồn kho của một sản phẩm (tất cả chi nhánh)
    // ══════════════════════════════════════════════════════════════════════

    @Query("SELECT COALESCE(SUM(si.quantity), 0) FROM StoreInventory si WHERE si.product.id = :productId")
    Integer sumStockByProduct(@Param("productId") Long productId);

    @Query("SELECT COALESCE(MIN(si.minQuantity), 0) FROM StoreInventory si WHERE si.product.id = :productId")
    Integer minStockByProduct(@Param("productId") Long productId);

    // ══════════════════════════════════════════════════════════════════════
    // PRODUCT MGMT — Tổng tồn kho cho nhiều product (batch, tránh N+1)
    // ══════════════════════════════════════════════════════════════════════

    @Query(value = """
            SELECT si.product_id, SUM(si.quantity) AS total_stock
            FROM store_inventory si
            WHERE si.product_id IN (:productIds)
            GROUP BY si.product_id
            """, nativeQuery = true)
    List<Object[]> sumStockByProductIds(@Param("productIds") List<Long> productIds);

    @Query(value = """
            SELECT si.product_id, MIN(si.min_quantity) AS min_stock
            FROM store_inventory si
            WHERE si.product_id IN (:productIds)
            GROUP BY si.product_id
            """, nativeQuery = true)
    List<Object[]> minStockByProductIds(@Param("productIds") List<Long> productIds);

    // ══════════════════════════════════════════════════════════════════════
    // PRODUCT MGMT — Cập nhật tồn kho (tất cả chi nhánh hoặc 1 chi nhánh)
    // ══════════════════════════════════════════════════════════════════════

    @Query("""
            SELECT si FROM StoreInventory si
            WHERE si.product.id = :productId
              AND si.store.id   = :storeId
            """)
    Optional<StoreInventory> findByProductIdAndStoreId(
            @Param("productId") Long productId,
            @Param("storeId")   Long storeId
    );

    @Modifying
    @Query("""
            UPDATE StoreInventory si
            SET si.quantity = :quantity
            WHERE si.product.id = :productId
            """)
    int updateQuantityAllStores(
            @Param("productId") Long productId,
            @Param("quantity")  Integer quantity
    );

    @Modifying
    @Query("""
            UPDATE StoreInventory si
            SET si.minQuantity = :minQuantity
            WHERE si.product.id = :productId
            """)
    int updateMinQuantityAllStores(
            @Param("productId")   Long productId,
            @Param("minQuantity") Integer minQuantity
    );

    // INVENTORY
    List<StoreInventory> findByStoreId(Long storeId);

    /**
     * Upsert: tăng qty nếu bản ghi đã tồn tại, tạo mới nếu chưa có.
     * Dùng cho IMPORT — không cần kiểm tra âm.
     */
    @Modifying
    @Query(value = """
            INSERT INTO store_inventory (store_id, product_id, quantity, min_quantity, updated_at)
            VALUES (:storeId, :productId, :qty, 5, NOW())
            ON DUPLICATE KEY UPDATE
                quantity   = quantity + :qty,
                updated_at = NOW()
            """, nativeQuery = true)
    void upsertQuantity(
            @Param("storeId")   Long storeId,
            @Param("productId") Long productId,
            @Param("qty")       int qty
    );

    /**
     * Danh sách tồn kho thấp: quantity <= min_quantity.
     * Object[]: [0]=store_id, [1]=product_id, [2]=quantity, [3]=min_quantity
     */
    @Query(value = """
            SELECT si.store_id, si.product_id, si.quantity, si.min_quantity
            FROM store_inventory si
            WHERE si.quantity <= si.min_quantity
              AND (:storeId IS NULL OR si.store_id = :storeId)
            ORDER BY si.quantity ASC
            """, nativeQuery = true)
    List<Object[]> findLowStock(@Param("storeId") Long storeId);

    /**
     * Tổng hợp tồn kho theo chi nhánh (cho BranchInventoryDto).
     * Object[]: [0]=store_id, [1]=store_name, [2]=productCount,
     *           [3]=totalQty, [4]=lowStockCount, [5]=inventoryValue
     */
    @Query(value = """
            SELECT
                s.store_id,
                s.name,
                COUNT(DISTINCT si.product_id)                         AS product_count,
                COALESCE(SUM(si.quantity), 0)                         AS total_qty,
                SUM(CASE WHEN si.quantity <= si.min_quantity THEN 1 ELSE 0 END) AS low_stock_count,
                COALESCE(SUM(si.quantity *
                    COALESCE(p.sale_price, p.base_price)), 0)         AS inventory_value
            FROM stores s
            LEFT JOIN store_inventory si ON si.store_id = s.store_id
            LEFT JOIN products p         ON p.product_id = si.product_id
            WHERE s.is_active = 1
              AND (:storeId IS NULL OR s.store_id = :storeId)
            GROUP BY s.store_id, s.name
            ORDER BY s.name
            """, nativeQuery = true)
    List<Object[]> aggregateByBranch(@Param("storeId") Long storeId);

    /**
     * Danh sách sản phẩm kèm tồn kho tổng hợp (cho ProductInventoryDto).
     * Object[]: [0]=product_id, [1]=sku, [2]=name, [3]=totalStock,
     *           [4]=minQty, [5]=estimatedValue, [6]=isLowStock
     */
    @Query(value = """
            SELECT
                p.product_id,
                p.sku,
                p.name,
                COALESCE(SUM(si.quantity), 0)                              AS total_stock,
                COALESCE(MIN(si.min_quantity), 0)                          AS min_qty,
                COALESCE(SUM(si.quantity * COALESCE(p.sale_price, p.base_price)), 0) AS estimated_value,
                CASE WHEN COALESCE(SUM(si.quantity), 0) <=
                          COALESCE(MIN(si.min_quantity), 0) THEN 1 ELSE 0 END AS is_low_stock
            FROM products p
            LEFT JOIN store_inventory si ON si.product_id = p.product_id
                AND (:storeId IS NULL OR si.store_id = :storeId)
            WHERE p.is_active = 1
              AND (:q IS NULL
                   OR LOWER(p.name) LIKE LOWER(CONCAT('%',:q,'%'))
                   OR LOWER(p.sku)  LIKE LOWER(CONCAT('%',:q,'%')))
            GROUP BY p.product_id, p.sku, p.name
            HAVING (:lowStockOnly = 0
                    OR COALESCE(SUM(si.quantity), 0) <= COALESCE(MIN(si.min_quantity), 0))
            ORDER BY p.name
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    List<Object[]> findProductsWithStock(
            @Param("storeId")      Long    storeId,
            @Param("q")            String  q,
            @Param("lowStockOnly") int     lowStockOnly,
            @Param("limit")        int     limit,
            @Param("offset")       int     offset
    );

    /**
     * FIXED: thêm GROUP BY trước HAVING (lỗi cũ thiếu GROUP BY khiến HAVING
     * tính SUM/MIN trên TOÀN BỘ bảng thay vì theo từng sản phẩm, dẫn tới
     * lowStockOnly=1 luôn trả COUNT=0).
     */
    @Query(value = """
            SELECT COUNT(*) FROM (
                SELECT p.product_id
                FROM products p
                LEFT JOIN store_inventory si ON si.product_id = p.product_id
                    AND (:storeId IS NULL OR si.store_id = :storeId)
                WHERE p.is_active = 1
                  AND (:q IS NULL
                       OR LOWER(p.name) LIKE LOWER(CONCAT('%',:q,'%'))
                       OR LOWER(p.sku)  LIKE LOWER(CONCAT('%',:q,'%')))
                GROUP BY p.product_id
                HAVING (:lowStockOnly = 0
                        OR COALESCE(SUM(si.quantity), 0) <= COALESCE(MIN(si.min_quantity), 0))
            ) t
            """, nativeQuery = true)
    long countProductsWithStock(
            @Param("storeId")      Long   storeId,
            @Param("q")            String q,
            @Param("lowStockOnly") int    lowStockOnly
    );

    /** Stock của một sản phẩm theo từng chi nhánh. Object[]: [0]=store_id, [1]=quantity */
    @Query(value = """
            SELECT si.store_id, si.quantity
            FROM store_inventory si
            WHERE si.product_id = :productId
            """, nativeQuery = true)
    List<Object[]> findStockByBranch(@Param("productId") Long productId);

    Optional<StoreInventory> findByStore_IdAndProduct_Id(Long storeId, Long productId);
}