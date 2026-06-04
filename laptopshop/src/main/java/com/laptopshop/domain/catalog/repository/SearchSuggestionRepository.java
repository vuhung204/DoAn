package com.laptopshop.domain.catalog.repository;

import com.laptopshop.domain.catalog.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SearchSuggestionRepository extends JpaRepository<Product, Long> {

    /**
     * Tìm kiếm nhanh: khớp name HOẶC brand name, trả về đủ field để build DTO.
     * FULLTEXT search nếu DB có index; fallback LIKE cho đơn giản.
     */
    /**
     * Tìm kiếm nhanh: khớp name HOẶC brand name, trả về đủ field để build DTO.
     * FULLTEXT search nếu DB có index; fallback LIKE cho đơn giản.
     */
    @Query(value = """
        SELECT
            p.product_id                              AS id,
            p.name                                    AS name,
            p.slug                                    AS slug,
            b.name                                    AS brandName,
            c.name                                    AS categoryName,
            COALESCE(p.sale_price, p.base_price)      AS price,
            pi_img.image_url                          AS imageUrl
        FROM products p
        JOIN brands     b     ON b.brand_id    = p.brand_id
        JOIN categories c     ON c.category_id = p.category_id
        LEFT JOIN product_images pi_img
               ON pi_img.product_id = p.product_id AND pi_img.is_primary = 1
        WHERE p.is_active = 1
          AND (
              p.name  LIKE CONCAT('%', :q, '%')
           OR b.name  LIKE CONCAT('%', :q, '%')
          )
        ORDER BY
            -- ưu tiên match từ đầu tên
            CASE WHEN p.name LIKE CONCAT(:q, '%') THEN 0 ELSE 1 END,
            p.name ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findSuggestions(@Param("q") String q, @Param("limit") int limit);
}
