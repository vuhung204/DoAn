package com.laptopshop.domain.inventory.repository;

import com.laptopshop.domain.inventory.entity.InventoryAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryAlertRepository extends JpaRepository<InventoryAlert, Long> {

    Optional<InventoryAlert> findByStoreIdAndProductId(Long storeId, Long productId);

    /**
     * Lấy danh sách alert chưa resolved, lọc theo severity và chi nhánh.
     */
    @Query("""
            SELECT a FROM InventoryAlert a
            JOIN FETCH a.store   s
            JOIN FETCH a.product p
            WHERE a.isResolved = false
              AND (:storeId   IS NULL OR s.id            = :storeId)
              AND (:severity  IS NULL OR a.severity      = :severity)
            ORDER BY
                CASE a.severity WHEN 'critical' THEN 1
                                WHEN 'warning'  THEN 2
                                ELSE 3 END,
                a.stock ASC
            """)
    List<InventoryAlert> findActiveAlerts(
            @Param("storeId")  Long   storeId,
            @Param("severity") String severity
    );

    /**
     * Upsert alert: INSERT hoặc UPDATE nếu đã tồn tại (dựa trên unique key store+product).
     */
    @Modifying
    @Query(value = """
            INSERT INTO inventory_alerts
                (store_id, product_id, stock, min_stock, severity, note, is_resolved, created_at, updated_at)
            VALUES
                (:storeId, :productId, :stock, :minStock, :severity, :note, 0, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                stock       = :stock,
                min_stock   = :minStock,
                severity    = :severity,
                note        = :note,
                is_resolved = 0,
                updated_at  = NOW()
            """, nativeQuery = true)
    void upsertAlert(
            @Param("storeId")   Long   storeId,
            @Param("productId") Long   productId,
            @Param("stock")     int    stock,
            @Param("minStock")  int    minStock,
            @Param("severity")  String severity,
            @Param("note")      String note
    );

    /**
     * Đánh dấu resolved khi stock vượt ngưỡng.
     */
    @Modifying
    @Query("""
            UPDATE InventoryAlert a
            SET a.isResolved = true, a.updatedAt = CURRENT_TIMESTAMP
            WHERE a.store.id   = :storeId
              AND a.product.id = :productId
            """)
    void resolveAlert(@Param("storeId") Long storeId, @Param("productId") Long productId);
}
