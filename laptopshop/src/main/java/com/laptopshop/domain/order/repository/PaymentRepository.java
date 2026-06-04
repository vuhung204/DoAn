package com.laptopshop.domain.order.repository;

import com.laptopshop.domain.order.entity.Payment;
import com.laptopshop.domain.order.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderId(Long orderId);
    Optional<Payment> findByTransactionId(String transactionId);

    /**
     * Cập nhật trạng thái payment khi refund hoàn tất.
     */
    @Modifying
    @Query("""
            UPDATE Payment p
            SET p.status = :status
            WHERE p.order.id = :orderId
            """)
    int updateStatusByOrderId(@Param("orderId") Long orderId,
                              @Param("status") PaymentStatus status);
}
