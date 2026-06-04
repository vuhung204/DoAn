package com.laptopshop.domain.catalog.repository;

import com.laptopshop.domain.catalog.entity.Brand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {
    List<Brand> findAllByIsActiveTrueOrderByName();

    @Query("SELECT b FROM Brand b WHERE b.isActive = true ORDER BY b.name")
    List<Brand> findAllActive();

    // ══════════════════════════════════════════════════════════════════════
    // BRAND MGMT — Search + filter + paging
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Tìm kiếm brand theo tên/slug + filter active.
     * active = null → bỏ qua filter.
     */
    @Query("""
            SELECT b FROM Brand b
            WHERE (:q IS NULL OR (
                       LOWER(b.name) LIKE LOWER(CONCAT('%',:q,'%'))
                    OR LOWER(b.slug) LIKE LOWER(CONCAT('%',:q,'%'))
            ))
              AND (:active IS NULL OR b.isActive = :active)
            """)
    Page<Brand> search(
            @Param("q")      String q,
            @Param("active") Boolean active,
            Pageable pageable
    );

    // ══════════════════════════════════════════════════════════════════════
    // BRAND MGMT — List kèm productCount (native, dùng cho export/summary)
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Tất cả brand kèm số sản phẩm — LEFT JOIN COUNT.
     * Trả Object[]:
     *   [0] Long    brandId
     *   [1] String  name
     *   [2] String  slug
     *   [3] String  logoUrl
     *   [4] String  description
     *   [5] String  website
     *   [6] Boolean isActive
     *   [7] Long    productCount
     *   [8] LocalDateTime createdAt
     *   [9] LocalDateTime updatedAt
     */
    @Query(value = """
            SELECT b.brand_id,
                   b.name,
                   b.slug,
                   b.logo_url,
                   b.description,
                   b.website,
                   b.is_active,
                   COUNT(p.product_id) AS product_count,
                   b.created_at,
                   b.updated_at
            FROM brands b
            LEFT JOIN products p ON p.brand_id = b.brand_id
            WHERE (:q      IS NULL OR (
                       LOWER(b.name) LIKE CONCAT('%', LOWER(:q), '%')
                    OR LOWER(b.slug) LIKE CONCAT('%', LOWER(:q), '%')
            ))
              AND (:active IS NULL OR b.is_active = :active)
            GROUP BY b.brand_id, b.name, b.slug, b.logo_url,
                     b.description, b.website, b.is_active,
                     b.created_at, b.updated_at
            ORDER BY b.name
            """,
            nativeQuery = true)
    List<Object[]> findAllWithProductCount(
            @Param("q")      String q,
            @Param("active") Boolean active
    );

    // ══════════════════════════════════════════════════════════════════════
    // BRAND MGMT — Stats
    // ══════════════════════════════════════════════════════════════════════

    /** Đếm brand đang active */
    long countByIsActiveTrue();

    /**
     * Đếm brand có ít nhất 1 sản phẩm.
     */
    @Query(value = """
            SELECT COUNT(DISTINCT b.brand_id)
            FROM brands b
            INNER JOIN products p ON p.brand_id = b.brand_id
            """, nativeQuery = true)
    int countBrandsWithProducts();

    /**
     * Đếm tổng sản phẩm toàn hệ thống — dùng cho stat card.
     */
    @Query(value = "SELECT COUNT(*) FROM products WHERE is_active = 1",
            nativeQuery = true)
    int countTotalActiveProducts();

    // ══════════════════════════════════════════════════════════════════════
    // BRAND MGMT — Slug uniqueness
    // ══════════════════════════════════════════════════════════════════════

    Optional<Brand> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @Query("SELECT COUNT(b) > 0 FROM Brand b WHERE b.slug = :slug AND b.id <> :excludeId")
    boolean existsBySlugAndIdNot(
            @Param("slug")      String slug,
            @Param("excludeId") Long excludeId
    );

    // ══════════════════════════════════════════════════════════════════════
    // BRAND MGMT — Kiểm tra có sản phẩm trước khi delete
    // ══════════════════════════════════════════════════════════════════════

    @Query("SELECT COUNT(p) FROM Product p WHERE p.brand.id = :brandId")
    long countProductsByBrand(@Param("brandId") Long brandId);

    // ══════════════════════════════════════════════════════════════════════
    // BRAND MGMT — Toggle active
    // ══════════════════════════════════════════════════════════════════════

    @Modifying
    @Query("UPDATE Brand b SET b.isActive = :active WHERE b.id = :id")
    int updateActive(@Param("id") Long id, @Param("active") Boolean active);

    List<Brand> findByIsActiveTrueOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);
}
