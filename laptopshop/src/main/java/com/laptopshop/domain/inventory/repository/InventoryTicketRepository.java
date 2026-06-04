package com.laptopshop.domain.inventory.repository;

import com.laptopshop.domain.inventory.entity.InventoryTicket;
import com.laptopshop.domain.inventory.enums.InventoryTicketType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InventoryTicketRepository extends JpaRepository<InventoryTicket, Long> {

    /**
     * Tìm kiếm phiếu kho theo type + filter.
     */
    @Query(
            value = """
            SELECT t FROM InventoryTicket t
            LEFT JOIN FETCH t.fromStore fs
            LEFT JOIN FETCH t.toStore   ts
            LEFT JOIN FETCH t.createdBy cb
            WHERE t.ticketType = :type
              AND (:storeId  IS NULL OR fs.id = :storeId OR ts.id = :storeId)
              AND (:status   IS NULL OR CAST(t.status AS string) = :status)
              AND (:from     IS NULL OR t.createdAt >= :from)
              AND (:to       IS NULL OR t.createdAt <= :to)
            ORDER BY t.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(t) FROM InventoryTicket t
            WHERE t.ticketType = :type
              AND (:storeId IS NULL OR t.fromStore.id = :storeId OR t.toStore.id = :storeId)
              AND (:status  IS NULL OR CAST(t.status AS string) = :status)
              AND (:from    IS NULL OR t.createdAt >= :from)
              AND (:to      IS NULL OR t.createdAt <= :to)
            """)
    Page<InventoryTicket> findByTypeAndFilters(
            @Param("type")    InventoryTicketType type,
            @Param("storeId") Long storeId,
            @Param("status")  String status,
            @Param("from")    LocalDateTime from,
            @Param("to")      LocalDateTime to,
            Pageable pageable
    );

    /**
     * Lấy chi tiết phiếu kèm lines + product info.
     */
    @Query("""
            SELECT t FROM InventoryTicket t
            LEFT JOIN FETCH t.fromStore
            LEFT JOIN FETCH t.toStore
            LEFT JOIN FETCH t.createdBy
            LEFT JOIN FETCH t.lines l
            LEFT JOIN FETCH l.product p
            WHERE t.id = :ticketId
            """)
    Optional<InventoryTicket> findDetailById(@Param("ticketId") Long ticketId);

    /**
     * Export: toàn bộ phiếu theo type + filters (không phân trang).
     */
    @Query("""
            SELECT t FROM InventoryTicket t
            LEFT JOIN FETCH t.fromStore
            LEFT JOIN FETCH t.toStore
            LEFT JOIN FETCH t.createdBy
            WHERE t.ticketType = :type
              AND (:storeId IS NULL OR t.fromStore.id = :storeId OR t.toStore.id = :storeId)
              AND (:from    IS NULL OR t.createdAt >= :from)
              AND (:to      IS NULL OR t.createdAt <= :to)
            ORDER BY t.createdAt DESC
            """)
    List<InventoryTicket> findForExport(
            @Param("type")    InventoryTicketType type,
            @Param("storeId") Long storeId,
            @Param("from")    LocalDateTime from,
            @Param("to")      LocalDateTime to
    );
}
