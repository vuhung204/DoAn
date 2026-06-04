package com.laptopshop.domain.inventory.repository;

import com.laptopshop.domain.inventory.entity.InventoryTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    // ── Tab: Import (STOCK_IN) ───────────────────────────────────────────
    /**
     * Danh sách phiếu nhập kho — mỗi batch_ref = 1 phiếu nhập.
     * GROUP BY batch_ref để gom các dòng cùng phiếu thành 1 row.
     * supplier lưu trong cột note với prefix "SUPPLIER:" (convention đơn giản).
     * Nếu hệ thống có bảng purchase_orders riêng thì JOIN vào đây.
     */
    @Query(value = """
            SELECT
                t.batch_ref                             AS ticket_id,
                s.name                                  AS store_name,
                t.note                                  AS supplier_note,
                SUM(t.quantity_delta)                   AS total_qty,
                DATE(t.created_at)                      AS created_date,
                MAX(t.created_at)                       AS created_at
            FROM inventory_transactions t
            JOIN stores s ON s.store_id = t.store_id
            WHERE t.transaction_type = 'STOCK_IN'
              AND (:storeId   IS NULL OR t.store_id  = :storeId)
              AND (:dateFrom  IS NULL OR DATE(t.created_at) >= :dateFrom)
              AND (:dateTo    IS NULL OR DATE(t.created_at) <= :dateTo)
            GROUP BY t.batch_ref, s.name, t.note
            ORDER BY MAX(t.created_at) DESC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT t.batch_ref)
            FROM inventory_transactions t
            WHERE t.transaction_type = 'STOCK_IN'
              AND (:storeId  IS NULL OR t.store_id           = :storeId)
              AND (:dateFrom IS NULL OR DATE(t.created_at)  >= :dateFrom)
              AND (:dateTo   IS NULL OR DATE(t.created_at)  <= :dateTo)
            """,
            nativeQuery = true)
    Page<Object[]> findImportTickets(
            @Param("storeId")  Long storeId,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo,
            Pageable pageable);

    // ── Tab: Export (STOCK_OUT) ──────────────────────────────────────────
    @Query(value = """
            SELECT
                t.batch_ref                             AS ticket_id,
                s.name                                  AS store_name,
                t.note                                  AS reason_note,
                SUM(ABS(t.quantity_delta))              AS total_qty,
                DATE(t.created_at)                      AS created_date,
                MAX(t.created_at)                       AS created_at
            FROM inventory_transactions t
            JOIN stores s ON s.store_id = t.store_id
            WHERE t.transaction_type = 'STOCK_OUT'
              AND (:storeId   IS NULL OR t.store_id           = :storeId)
              AND (:dateFrom  IS NULL OR DATE(t.created_at)  >= :dateFrom)
              AND (:dateTo    IS NULL OR DATE(t.created_at)  <= :dateTo)
            GROUP BY t.batch_ref, s.name, t.note
            ORDER BY MAX(t.created_at) DESC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT t.batch_ref)
            FROM inventory_transactions t
            WHERE t.transaction_type = 'STOCK_OUT'
              AND (:storeId  IS NULL OR t.store_id           = :storeId)
              AND (:dateFrom IS NULL OR DATE(t.created_at)  >= :dateFrom)
              AND (:dateTo   IS NULL OR DATE(t.created_at)  <= :dateTo)
            """,
            nativeQuery = true)
    Page<Object[]> findExportTickets(
            @Param("storeId")  Long storeId,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo")   LocalDate dateTo,
            Pageable pageable);

    // ── Tab: Transfer ────────────────────────────────────────────────────
    /**
     * Mỗi phiếu chuyển kho gồm cặp TRANSFER_OUT + TRANSFER_IN có cùng batch_ref.
     * JOIN 2 lần vào stores để lấy tên chi nhánh gửi và nhận.
     */
    @Query(value = """
            SELECT
                tout.batch_ref                          AS ticket_id,
                sf.name                                 AS from_store,
                st.name                                 AS to_store,
                SUM(ABS(tout.quantity_delta))           AS total_qty,
                DATE(tout.created_at)                   AS created_date,
                MAX(tout.created_at)                    AS created_at,
                CASE
                    WHEN tin.batch_ref IS NULL THEN 'PREPARING'
                    ELSE 'RECEIVED'
                END                                     AS status
            FROM inventory_transactions tout
            JOIN stores sf ON sf.store_id = tout.store_id
            LEFT JOIN inventory_transactions tin
                   ON tin.batch_ref        = tout.batch_ref
                  AND tin.transaction_type = 'TRANSFER_IN'
            LEFT JOIN stores st ON st.store_id = tin.store_id
            WHERE tout.transaction_type = 'TRANSFER_OUT'
              AND (:dateFrom  IS NULL OR DATE(tout.created_at) >= :dateFrom)
              AND (:dateTo    IS NULL OR DATE(tout.created_at) <= :dateTo)
            GROUP BY tout.batch_ref, sf.name, st.name, tin.batch_ref
            ORDER BY MAX(tout.created_at) DESC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT batch_ref)
            FROM inventory_transactions
            WHERE transaction_type = 'TRANSFER_OUT'
              AND (:dateFrom IS NULL OR DATE(created_at) >= :dateFrom)
              AND (:dateTo   IS NULL OR DATE(created_at) <= :dateTo)
            """,
            nativeQuery = true)
    Page<Object[]> findTransferTickets(
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo")   LocalDate dateTo,
            Pageable pageable);

    // ── Tạo batch_ref duy nhất (dùng trong Service) ───────────────────────
    @Query(value = "SELECT COUNT(*) FROM inventory_transactions WHERE DATE(created_at) = CURDATE()",
            nativeQuery = true)
    long countTodayTransactions();

    // INVENTORY
    /**
     * Lịch sử giao dịch của một sản phẩm, có thể lọc thêm theo chi nhánh.
     */
    @Query(
            value = """
            SELECT t FROM InventoryTransaction t
            JOIN FETCH t.store   s
            JOIN FETCH t.product p
            LEFT JOIN FETCH t.staff st
            WHERE t.product.id = :productId
              AND (:storeId IS NULL OR t.store.id = :storeId)
              AND (:from    IS NULL OR t.createdAt >= :from)
              AND (:to      IS NULL OR t.createdAt <= :to)
            ORDER BY t.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(t) FROM InventoryTransaction t
            WHERE t.product.id = :productId
              AND (:storeId IS NULL OR t.store.id = :storeId)
              AND (:from    IS NULL OR t.createdAt >= :from)
              AND (:to      IS NULL OR t.createdAt <= :to)
            """)
    Page<InventoryTransaction> findHistory(
            @Param("productId") Long productId,
            @Param("storeId")   Long storeId,
            @Param("from")      LocalDateTime from,
            @Param("to")        LocalDateTime to,
            Pageable pageable
    );
}