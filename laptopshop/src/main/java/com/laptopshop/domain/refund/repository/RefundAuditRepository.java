package com.laptopshop.domain.refund.repository;

import com.laptopshop.domain.refund.entity.RefundAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RefundAuditRepository extends JpaRepository<RefundAudit, Long> {

    @Query("""
            SELECT a FROM RefundAudit a
            LEFT JOIN FETCH a.staff s
            WHERE a.returnRequest.id = :refundId
            ORDER BY a.createdAt ASC
            """)
    List<RefundAudit> findByRefundIdOrderByCreatedAt(@Param("refundId") Long refundId);

    List<RefundAudit> findByReturnRequest_IdOrderByCreatedAtAsc(Long returnId);
}
