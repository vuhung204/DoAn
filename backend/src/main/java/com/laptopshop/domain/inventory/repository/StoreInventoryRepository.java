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
    // SYNC ALERTS — Cross join stores × products (kể cả chưa có row tồn kho)
    // Trả về tất cả cặp (store, product) active, stock=0 nếu chưa có row.
    // Object[]: [0]=store_id, [1]=product_id, [2]=quantity, [3]=min_quantity
    // ══════════════════════════════════════════════════════════════════════

    @Query(value = """
            SELECT s.store_id, p.product_id,
                   COALESCE(si.quantity,     0) AS quantity,
                   COALESCE(si.min_quantity, 5) AS min_quantity
            FROM stores s
            CROSS JOIN products p
            LEFT JOIN store_inventory si
                   ON si.store_id   = s.store_id
                  AND si.product_id = p.product_id
            WHERE s.is_active = 1
              AND p.is_active = 1
            """, nativeQuery = true)
    List<Object[]> findAllStoreProductPairs();

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
    // PRODUCT MGMT
    // ══════════════════════════════════════════════════════════════════════

    @Query("SELECT COALESCE(SUM(si.quantity), 0) FROM StoreInventory si WHERE si.product.id = :productId")
    Integer sumStockByProduct(@Param("productId") Long productId);

    @Query("SELECT COALESCE(MIN(si.minQuantity), 0) FROM StoreInventory si WHERE si.product.id = :productId")
    Integer minStockByProduct(@Param("productId") Long productId);

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

    List<StoreInventory> findByStoreId(Long storeId);

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

    @Query(value = """
            SELECT si.store_id, si.product_id, si.quantity, si.min_quantity
            FROM store_inventory si
            WHERE si.quantity <= si.min_quantity
              AND (:storeId IS NULL OR si.store_id = :storeId)
            ORDER BY si.quantity ASC
            """, nativeQuery = true)
    List<Object[]> findLowStock(@Param("storeId") Long storeId);

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

    @Query(value = """
            SELECT si.store_id, si.quantity
            FROM store_inventory si
            WHERE si.product_id = :productId
            """, nativeQuery = true)
    List<Object[]> findStockByBranch(@Param("productId") Long productId);

    Optional<StoreInventory> findByStore_IdAndProduct_Id(Long storeId, Long productId);
}