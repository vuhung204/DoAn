package com.laptopshop.domain.warranty.repository;

import com.laptopshop.domain.warranty.entity.WarrantyRequest;
import com.laptopshop.domain.warranty.enums.WarrantyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WarrantyRequestRepository extends JpaRepository<WarrantyRequest, Long> {

    // ── Customer queries ──────────────────────────────────────────────────────

    Page<WarrantyRequest> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<WarrantyRequest> findByIdAndUserId(Long id, Long userId);

    @Query("""
            SELECT COUNT(w) > 0 FROM WarrantyRequest w
            WHERE w.orderItem.id = :orderItemId
              AND w.status NOT IN ('COMPLETED', 'REJECTED', 'CANCELLED')
            """)
    boolean existsActiveByOrderItemId(@Param("orderItemId") Long orderItemId);

    // ── Admin queries ─────────────────────────────────────────────────────────

    Page<WarrantyRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<WarrantyRequest> findByStatusOrderByCreatedAtDesc(WarrantyStatus status, Pageable pageable);

    // ── Shared: fetch join để tránh N+1 (dùng cho cả customer + admin detail) ─

    @Query("""
            SELECT w FROM WarrantyRequest w
            LEFT JOIN FETCH w.orderItem oi
            LEFT JOIN FETCH oi.product p
            LEFT JOIN FETCH p.images
            LEFT JOIN FETCH w.order o
            LEFT JOIN FETCH w.user u
            LEFT JOIN FETCH w.handledBy
            WHERE w.id = :id
            """)
    Optional<WarrantyRequest> findByIdWithDetails(@Param("id") Long id);

    @Query("""
        SELECT w.orderItem.id FROM WarrantyRequest w
        WHERE w.user.id = :userId
          AND w.order.id = :orderId
        """)
    List<Long> findOrderItemIdsByUserId(@Param("userId") Long userId,
                                        @Param("orderId") Long orderId);
}
