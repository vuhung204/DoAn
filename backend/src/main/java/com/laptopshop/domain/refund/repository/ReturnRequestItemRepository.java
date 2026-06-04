package com.laptopshop.domain.refund.repository;

import com.laptopshop.domain.refund.entity.ReturnRequestItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReturnRequestItemRepository extends JpaRepository<ReturnRequestItem, Long> {
    List<ReturnRequestItem> findByReturnRequest_Id(Long returnId);
}
