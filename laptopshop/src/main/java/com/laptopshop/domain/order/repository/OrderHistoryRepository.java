package com.laptopshop.domain.order.repository;

import com.laptopshop.domain.order.entity.OrderHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderHistoryRepository extends JpaRepository<OrderHistory, Long> {

    /**
     * Lấy toàn bộ lịch sử của một đơn, sắp xếp từ cũ → mới.
     * LEFT JOIN FETCH staff để tránh N+1 khi hiển thị tên nhân viên.
     */
    @Query("""
            SELECT h FROM OrderHistory h
            LEFT JOIN FETCH h.staff st
            WHERE h.order.id = :orderId
            ORDER BY h.createdAt ASC
            """)
    List<OrderHistory> findByOrderIdOrderByCreatedAtAsc(@Param("orderId") Long orderId);
}
