package com.laptopshop.domain.catalog.repository;

import com.laptopshop.domain.catalog.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    /** Lấy ảnh theo product, primary lên đầu, sau đó sort_order ASC */
    List<ProductImage> findByProductIdOrderByIsPrimaryDescSortOrderAsc(Long productId);

    /** Xóa tất cả ảnh của product — dùng khi update ảnh toàn bộ */
    @Modifying
    @Query("DELETE FROM ProductImage pi WHERE pi.product.id = :productId")
    void deleteAllByProductId(@Param("productId") Long productId);
}
