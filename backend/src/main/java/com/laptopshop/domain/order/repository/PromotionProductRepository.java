package com.laptopshop.domain.order.repository;

import com.laptopshop.domain.order.entity.PromotionProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PromotionProductRepository extends JpaRepository<PromotionProduct, Long> {

    @Query("SELECT pp.product.id FROM PromotionProduct pp WHERE pp.promotion.id = :promoId")
    List<Long> findProductIdsByPromotionId(@Param("promoId") Long promoId);

    /** Xoá toàn bộ mapping trước khi gán lại (replace strategy). */
    @Modifying
    @Query("DELETE FROM PromotionProduct pp WHERE pp.promotion.id = :promoId")
    void deleteByPromotionId(@Param("promoId") Long promoId);

    boolean existsByPromotionIdAndProductId(Long promotionId, Long productId);
}
