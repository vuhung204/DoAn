package com.laptopshop.domain.catalog.repository;

import com.laptopshop.domain.catalog.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByIdAndIsActiveTrue(Long id);

    @Query("""
        SELECT p FROM Product p
        WHERE p.isActive = true
        AND (:brandId IS NULL OR p.brand.id = :brandId)
        AND (:categoryId IS NULL OR p.category.id = :categoryId)
        AND (:minPrice IS NULL OR 
             (CASE WHEN p.salePrice IS NOT NULL THEN p.salePrice ELSE p.basePrice END) >= :minPrice)
        AND (:maxPrice IS NULL OR 
             (CASE WHEN p.salePrice IS NOT NULL THEN p.salePrice ELSE p.basePrice END) <= :maxPrice)
        AND (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
    """)
    Page<Product> findWithFilters(
            @Param("brandId") Long brandId,
            @Param("categoryId") Long categoryId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    // Query 1: images + spec + brand + category
    @Query("SELECT p FROM Product p " +
            "LEFT JOIN FETCH p.images " +
            "LEFT JOIN FETCH p.spec " +
            "LEFT JOIN FETCH p.brand " +
            "LEFT JOIN FETCH p.category " +
            "WHERE p.id = :id AND p.isActive = true")
    Optional<Product> findByIdWithImages(@Param("id") Long id);

    // Query 2: chỉ inventories
    @Query("SELECT p FROM Product p " +
            "LEFT JOIN FETCH p.inventories " +
            "WHERE p.id = :id")
    Optional<Product> findByIdWithInventories(@Param("id") Long id);

    // Query 3: chỉ reviews
    @Query("SELECT p FROM Product p " +
            "LEFT JOIN FETCH p.reviews " +
            "WHERE p.id = :id")
    Optional<Product> findByIdWithReviews(@Param("id") Long id);

    /**
     * Đếm tổng sản phẩm đang active — stat card "Tổng sản phẩm".
     */
    long countByIsActiveTrue();

    /**
     * Lấy thông tin cơ bản của nhiều sản phẩm theo id — dùng khi cần
     * enrich rows từ native query mà chỉ có productId.
     */
    @Query("""
            SELECT p FROM Product p
            WHERE p.id IN (:ids)
              AND p.isActive = true
            """)
    List<Product> findBasicInfoByIds(@Param("ids") List<Long> ids);


    // ══════════════════════════════════════════════════════════════════════
    // PRODUCT MGMT — Search + filter + paging (native)
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Tìm kiếm sản phẩm với đầy đủ filter.
     * visible: null=all, true=visible, false=hidden
     * Trả Page<Product> — service map sang ProductListDto.
     *
     * Lưu ý: sort field được truyền qua Pageable (Spring Data tự append ORDER BY).
     * Các sort field hợp lệ: name, basePrice, salePrice, createdAt
     */
    @Query("""
            SELECT p FROM Product p
            LEFT JOIN FETCH p.brand
            LEFT JOIN FETCH p.category
            WHERE (:q IS NULL OR (
                       LOWER(p.name) LIKE LOWER(CONCAT('%',:q,'%'))
                    OR LOWER(p.sku)  LIKE LOWER(CONCAT('%',:q,'%'))
            ))
            AND (:brandId    IS NULL OR p.brand.id    = :brandId)
            AND (:categoryId IS NULL OR p.category.id = :categoryId)
            AND (:visible    IS NULL OR p.isActive    = :visible)
            """)
    Page<Product> searchWithFilters(
            @Param("q")          String q,
            @Param("brandId")    Long brandId,
            @Param("categoryId") Long categoryId,
            @Param("visible")    Boolean visible,
            Pageable pageable
    );

    // ══════════════════════════════════════════════════════════════════════
    // PRODUCT MGMT — Detail: fetch với spec + images + brand + category
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Fetch product kèm spec, images, brand, category (tránh N+1).
     */
    @Query("""
            SELECT p FROM Product p
            LEFT JOIN FETCH p.spec
            LEFT JOIN FETCH p.images
            LEFT JOIN FETCH p.brand
            LEFT JOIN FETCH p.category
            WHERE p.id = :id
            """)
    Optional<Product> findByIdWithDetails(@Param("id") Long id);

    // ══════════════════════════════════════════════════════════════════════
    // PRODUCT MGMT — Check SKU unique (create/update)
    // ══════════════════════════════════════════════════════════════════════

    boolean existsBySku(String sku);

    @Query("SELECT COUNT(p) > 0 FROM Product p WHERE p.sku = :sku AND p.id <> :excludeId")
    boolean existsBySkuAndIdNot(@Param("sku") String sku, @Param("excludeId") Long excludeId);

    // ══════════════════════════════════════════════════════════════════════
    // PRODUCT MGMT — Visibility toggle
    // ══════════════════════════════════════════════════════════════════════

    @Modifying
    @Query("UPDATE Product p SET p.isActive = :visible WHERE p.id = :id")
    int updateVisibility(@Param("id") Long id, @Param("visible") Boolean visible);

    // ══════════════════════════════════════════════════════════════════════
    // PRODUCT MGMT — Export (lấy list kèm join để không N+1)
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Lấy tất cả sản phẩm kèm brand + category + spec cho export.
     * Filter bằng param optional.
     */
    @Query("""
            SELECT p FROM Product p
            LEFT JOIN FETCH p.brand
            LEFT JOIN FETCH p.category
            LEFT JOIN FETCH p.spec
            WHERE (:q IS NULL OR (
                       LOWER(p.name) LIKE LOWER(CONCAT('%',:q,'%'))
                    OR LOWER(p.sku)  LIKE LOWER(CONCAT('%',:q,'%'))
            ))
            AND (:brandId    IS NULL OR p.brand.id    = :brandId)
            AND (:categoryId IS NULL OR p.category.id = :categoryId)
            AND (:visible    IS NULL OR p.isActive    = :visible)
            ORDER BY p.name
            """)
    List<Product> findForExport(
            @Param("q")          String q,
            @Param("brandId")    Long brandId,
            @Param("categoryId") Long categoryId,
            @Param("visible")    Boolean visible
    );

    /**
     * Tìm kiếm sản phẩm cho customer — hỗ trợ thêm filter RAM và nhiều brandId.
     *
     * Bổ sung so với findWithFilters() cũ:
     *   - brandIds: danh sách nhiều brand (thay vì 1 brandId)
     *   - rams    : lọc theo product_specs.ram (LIKE '%8GB%')
     *
     * Fetch images + spec + brand ngay trong query để tránh N+1.
     */
    @Query("""
            SELECT DISTINCT p FROM Product p
            LEFT JOIN FETCH p.brand
            LEFT JOIN FETCH p.images
            LEFT JOIN FETCH p.spec
            WHERE p.isActive = true
            AND (:keyword IS NULL
                 OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
            AND (:#{#brandIds == null || #brandIds.isEmpty()} = true
                 OR p.brand.id IN :brandIds)
            AND (:categoryId IS NULL OR p.category.id = :categoryId)
            AND (:minPrice IS NULL
                 OR (CASE WHEN p.salePrice IS NOT NULL THEN p.salePrice ELSE p.basePrice END) >= :minPrice)
            AND (:maxPrice IS NULL
                 OR (CASE WHEN p.salePrice IS NOT NULL THEN p.salePrice ELSE p.basePrice END) <= :maxPrice)
            AND (:#{#rams == null || #rams.isEmpty()} = true
                 OR EXISTS (
                     SELECT 1 FROM ProductSpec s
                     WHERE s.product = p
                     AND s.ram IN :rams
                 ))
            """)
    Page<Product> searchForCustomer(
            @Param("keyword")    String keyword,
            @Param("brandIds")   List<Long> brandIds,
            @Param("categoryId") Long categoryId,
            @Param("minPrice")   BigDecimal minPrice,
            @Param("maxPrice")   BigDecimal maxPrice,
            @Param("rams")       List<String> rams,
            Pageable pageable
    );

    /**
     * Lấy danh sách RAM duy nhất — dùng để render sidebar filter.
     * Chỉ lấy của sản phẩm đang active.
     */
    @Query("""
            SELECT DISTINCT s.ram FROM ProductSpec s
            WHERE s.product.isActive = true
            AND s.ram IS NOT NULL
            ORDER BY s.ram
            """)
    List<String> findDistinctRams();

    /**
     * Lấy rating trung bình + số lượt review đã APPROVED cho một tập sản phẩm.
     *
     * Trả Object[]:
     *   [0] Long    productId
     *   [1] Double  avgRating  (null nếu chưa có review)
     *   [2] Long    reviewCount
     *
     * Dùng sau khi lấy Page<Product> để enrich rating vào ProductSearchResponse.
     */
    @Query("""
            SELECT r.product.id,
                   AVG(r.rating),
                   COUNT(r.id)
            FROM Review r
            WHERE r.product.id IN :productIds
              AND r.status = com.laptopshop.domain.review.enums.ReviewStatus.APPROVED
            GROUP BY r.product.id
            """)
    List<Object[]> findRatingStatsByProductIds(@Param("productIds") List<Long> productIds);

}
