package com.laptopshop.domain.catalog.repository;

import com.laptopshop.domain.catalog.entity.Brand;
import com.laptopshop.domain.catalog.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category,Long> {
    List<Category> findAllByIsActiveTrueAndParentIsNullOrderBySortOrder();

    /**
     * Tất cả danh mục đang active, sắp xếp theo sort_order.
     */
    @Query("SELECT c FROM Category c WHERE c.isActive = true ORDER BY c.sortOrder, c.name")
    List<Category> findAllActive();

    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long excludeId);

    List<Category> findByParentIdOrderBySortOrderAsc(Long parentId);

    /** Tất cả root categories (không có parent). */
    List<Category> findByParentIsNullOrderBySortOrderAsc();

    /**
     * Load tất cả categories có order để build tree trong service.
     * Ưu tiên root (parent IS NULL) trước, sau đó sort theo parentId + sortOrder.
     */
    @Query("""
            SELECT c FROM Category c
            LEFT JOIN FETCH c.parent
            ORDER BY
                CASE WHEN c.parent IS NULL THEN 0 ELSE 1 END,
                c.sortOrder ASC
            """)
    List<Category> findAllOrdered();

    /**
     * Tìm kiếm phẳng có filter — dùng cho admin grid.
     */
    @Query(
            value = """
            SELECT c FROM Category c
            WHERE (:q       IS NULL
                   OR LOWER(c.name) LIKE LOWER(CONCAT('%',:q,'%'))
                   OR LOWER(c.slug) LIKE LOWER(CONCAT('%',:q,'%')))
              AND (:visible IS NULL OR c.isActive = :visible)
            ORDER BY c.sortOrder ASC
            """,
            countQuery = """
            SELECT COUNT(c) FROM Category c
            WHERE (:q       IS NULL
                   OR LOWER(c.name) LIKE LOWER(CONCAT('%',:q,'%'))
                   OR LOWER(c.slug) LIKE LOWER(CONCAT('%',:q,'%')))
              AND (:visible IS NULL OR c.isActive = :visible)
            """)
    Page<Category> searchCategories(
            @Param("q")       String  q,
            @Param("visible") Boolean visible,
            Pageable pageable
    );

    /**
     * Đếm số sản phẩm trực tiếp thuộc danh mục.
     */
    @Query(value = "SELECT COUNT(1) FROM products p WHERE p.category_id = :categoryId",
            nativeQuery = true)
    int countProductsByCategory(@Param("categoryId") Long categoryId);

    /**
     * Lấy toàn bộ ID descendants (dùng để validate cycle và delete cascade).
     * Dùng recursive CTE — MySQL 8.0+.
     */
    @Query(value = """
            WITH RECURSIVE descendants AS (
                SELECT category_id FROM categories WHERE parent_id = :categoryId
                UNION ALL
                SELECT c.category_id FROM categories c
                INNER JOIN descendants d ON c.parent_id = d.category_id
            )
            SELECT category_id FROM descendants
            """, nativeQuery = true)
    List<Long> findDescendantIds(@Param("categoryId") Long categoryId);

    /**
     * Cập nhật visibility.
     */
    @Modifying
    @Query("UPDATE Category c SET c.isActive = :visible, c.updatedAt = CURRENT_TIMESTAMP WHERE c.id = :id")
    int setVisibility(@Param("id") Long id, @Param("visible") boolean visible);

    /**
     * Cập nhật sortOrder của một category.
     */
    @Modifying
    @Query("UPDATE Category c SET c.sortOrder = :order, c.updatedAt = CURRENT_TIMESTAMP WHERE c.id = :id")
    void updateSortOrder(@Param("id") Long id, @Param("order") int order);

    /**
     * Lấy tất cả category active, sắp xếp theo sort_order.
     * Dùng JOIN FETCH parent để tránh N+1 khi build tree.
     */
    @Query("""
        SELECT c FROM Category c
        LEFT JOIN FETCH c.parent
        WHERE c.isActive = true
        ORDER BY c.sortOrder ASC, c.id ASC
        """)
    List<Category> findAllActiveOrdered();
}
