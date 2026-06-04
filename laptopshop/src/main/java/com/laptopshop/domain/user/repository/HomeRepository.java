package com.laptopshop.domain.user.repository;

import com.laptopshop.domain.catalog.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HomeRepository extends JpaRepository<Product, Long> {

    // ─── Sản phẩm nổi bật (đã có) ────────────────────────────────────────────
    /**
     * Lấy sản phẩm nổi bật: join specs + image + tổng tồn kho + avg rating.
     * Sắp xếp theo số lượng bán (order_deduct từ inventory_transactions).
     */
    @Query(value = """
        SELECT
            p.product_id,
            p.name,
            p.slug,
            b.name          AS brand_name,
            c.name          AS category_name,
            c.slug          AS category_slug,
            p.base_price,
            p.sale_price,
            pi.image_url,
            ps.cpu,
            ps.ram,
            ps.storage,
            ps.display,
            ps.gpu,
            COALESCE(r.avg_rating, 0)    AS avg_rating,
            COALESCE(r.review_count, 0)  AS review_count,
            COALESCE(inv.total_stock, 0) AS total_stock
        FROM products p
        JOIN brands     b  ON b.brand_id    = p.brand_id
        JOIN categories c  ON c.category_id = p.category_id
        LEFT JOIN product_images pi
               ON pi.product_id = p.product_id AND pi.is_primary = 1
        LEFT JOIN product_specs  ps ON ps.product_id = p.product_id
        LEFT JOIN (
            SELECT product_id,
                   AVG(rating)   AS avg_rating,
                   COUNT(*)      AS review_count
            FROM   reviews
            WHERE  status = 'APPROVED'
            GROUP  BY product_id
        ) r ON r.product_id = p.product_id
        LEFT JOIN (
            SELECT product_id, SUM(quantity) AS total_stock
            FROM   store_inventory
            GROUP  BY product_id
        ) inv ON inv.product_id = p.product_id
        WHERE p.is_active = 1
        ORDER BY COALESCE(inv.total_stock, 0) DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findFeaturedProducts(@Param("limit") int limit);

    // ─── Sản phẩm theo danh mục slug (đã có) ─────────────────────────────────
    @Query(value = """
        SELECT
            p.product_id,
            p.name,
            p.slug,
            b.name          AS brand_name,
            c.name          AS category_name,
            c.slug          AS category_slug,
            p.base_price,
            p.sale_price,
            pi.image_url,
            ps.cpu,
            ps.ram,
            ps.storage,
            ps.display,
            ps.gpu,
            COALESCE(r.avg_rating, 0)    AS avg_rating,
            COALESCE(r.review_count, 0)  AS review_count,
            COALESCE(inv.total_stock, 0) AS total_stock
        FROM products p
        JOIN brands     b  ON b.brand_id    = p.brand_id
        JOIN categories c  ON c.category_id = p.category_id
        LEFT JOIN product_images pi
               ON pi.product_id = p.product_id AND pi.is_primary = 1
        LEFT JOIN product_specs  ps ON ps.product_id = p.product_id
        LEFT JOIN (
            SELECT product_id,
                   AVG(rating)   AS avg_rating,
                   COUNT(*)      AS review_count
            FROM   reviews
            WHERE  status = 'APPROVED'
            GROUP  BY product_id
        ) r ON r.product_id = p.product_id
        LEFT JOIN (
            SELECT product_id, SUM(quantity) AS total_stock
            FROM   store_inventory
            GROUP  BY product_id
        ) inv ON inv.product_id = p.product_id
        WHERE p.is_active = 1
          AND (c.slug = :categorySlug
               OR EXISTS (
                   SELECT 1 FROM categories parent
                   WHERE parent.slug = :categorySlug
                     AND c.parent_id = parent.category_id
               ))
        ORDER BY COALESCE(inv.total_stock, 0) DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findProductsByCategorySlug(
            @Param("categorySlug") String categorySlug,
            @Param("limit") int limit);

    // ─── MỚI: Sản phẩm bán chạy nhất ────────────────────────────────────────
    /**
     * Tính từ order_items (chỉ đơn COMPLETED) → tổng số lượng đã bán.
     */
    @Query(value = """
        SELECT
            p.product_id,
            p.name,
            p.slug,
            b.name          AS brand_name,
            c.name          AS category_name,
            c.slug          AS category_slug,
            p.base_price,
            p.sale_price,
            pi.image_url,
            ps.cpu,
            ps.ram,
            ps.storage,
            ps.display,
            ps.gpu,
            COALESCE(r.avg_rating, 0)    AS avg_rating,
            COALESCE(r.review_count, 0)  AS review_count,
            COALESCE(inv.total_stock, 0) AS total_stock
        FROM products p
        JOIN brands     b  ON b.brand_id    = p.brand_id
        JOIN categories c  ON c.category_id = p.category_id
        LEFT JOIN product_images pi
               ON pi.product_id = p.product_id AND pi.is_primary = 1
        LEFT JOIN product_specs  ps ON ps.product_id = p.product_id
        LEFT JOIN (
            SELECT product_id,
                   AVG(rating)   AS avg_rating,
                   COUNT(*)      AS review_count
            FROM   reviews
            WHERE  status = 'APPROVED'
            GROUP  BY product_id
        ) r ON r.product_id = p.product_id
        LEFT JOIN (
            SELECT product_id, SUM(quantity) AS total_stock
            FROM   store_inventory
            GROUP  BY product_id
        ) inv ON inv.product_id = p.product_id
        INNER JOIN (
            SELECT oi.product_id,
                   SUM(oi.quantity) AS total_sold
            FROM   order_items oi
            JOIN   orders      o  ON o.order_id = oi.order_id
            WHERE  o.status = 'COMPLETED'
            GROUP  BY oi.product_id
        ) sold ON sold.product_id = p.product_id
        WHERE p.is_active = 1
        ORDER BY sold.total_sold DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findBestSellingProducts(@Param("limit") int limit);

    // ─── MỚI: Sản phẩm được đánh giá cao nhất ────────────────────────────────
    /**
     * Sản phẩm có rating trung bình cao nhất, tối thiểu 1 review APPROVED.
     * Sắp theo avg_rating DESC, review_count DESC.
     */
    @Query(value = """
        SELECT
            p.product_id,
            p.name,
            p.slug,
            b.name          AS brand_name,
            c.name          AS category_name,
            c.slug          AS category_slug,
            p.base_price,
            p.sale_price,
            pi.image_url,
            ps.cpu,
            ps.ram,
            ps.storage,
            ps.display,
            ps.gpu,
            r.avg_rating,
            r.review_count,
            COALESCE(inv.total_stock, 0) AS total_stock
        FROM products p
        JOIN brands     b  ON b.brand_id    = p.brand_id
        JOIN categories c  ON c.category_id = p.category_id
        LEFT JOIN product_images pi
               ON pi.product_id = p.product_id AND pi.is_primary = 1
        LEFT JOIN product_specs  ps ON ps.product_id = p.product_id
        INNER JOIN (
            SELECT product_id,
                   AVG(rating)   AS avg_rating,
                   COUNT(*)      AS review_count
            FROM   reviews
            WHERE  status = 'APPROVED'
            GROUP  BY product_id
            HAVING COUNT(*) >= 1
        ) r ON r.product_id = p.product_id
        LEFT JOIN (
            SELECT product_id, SUM(quantity) AS total_stock
            FROM   store_inventory
            GROUP  BY product_id
        ) inv ON inv.product_id = p.product_id
        WHERE p.is_active = 1
        ORDER BY r.avg_rating DESC, r.review_count DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTopRatedProducts(@Param("limit") int limit);

    // ─── MỚI: Sản phẩm MacBook (theo brand slug) ─────────────────────────────
    @Query(value = """
        SELECT
            p.product_id,
            p.name,
            p.slug,
            b.name          AS brand_name,
            c.name          AS category_name,
            c.slug          AS category_slug,
            p.base_price,
            p.sale_price,
            pi.image_url,
            ps.cpu,
            ps.ram,
            ps.storage,
            ps.display,
            ps.gpu,
            COALESCE(r.avg_rating, 0)    AS avg_rating,
            COALESCE(r.review_count, 0)  AS review_count,
            COALESCE(inv.total_stock, 0) AS total_stock
        FROM products p
        JOIN brands     b  ON b.brand_id    = p.brand_id
        JOIN categories c  ON c.category_id = p.category_id
        LEFT JOIN product_images pi
               ON pi.product_id = p.product_id AND pi.is_primary = 1
        LEFT JOIN product_specs  ps ON ps.product_id = p.product_id
        LEFT JOIN (
            SELECT product_id,
                   AVG(rating)   AS avg_rating,
                   COUNT(*)      AS review_count
            FROM   reviews
            WHERE  status = 'APPROVED'
            GROUP  BY product_id
        ) r ON r.product_id = p.product_id
        LEFT JOIN (
            SELECT product_id, SUM(quantity) AS total_stock
            FROM   store_inventory
            GROUP  BY product_id
        ) inv ON inv.product_id = p.product_id
        WHERE p.is_active = 1
          AND b.slug = :brandSlug
        ORDER BY p.created_at DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findProductsByBrandSlug(
            @Param("brandSlug") String brandSlug,
            @Param("limit") int limit);

    // ─── Danh mục root (đã có) ───────────────────────────────────────────────
    @Query(value = """
        SELECT
            c.category_id,
            c.name,
            c.slug,
            c.sort_order,
            COUNT(p.product_id) AS product_count
        FROM   categories c
        LEFT JOIN products p
               ON p.category_id = c.category_id AND p.is_active = 1
        WHERE  c.is_active = 1
          AND  c.parent_id IS NULL
        GROUP  BY c.category_id, c.name, c.slug, c.sort_order
        ORDER  BY c.sort_order
        """, nativeQuery = true)
    List<Object[]> findRootCategories();

    // ─── Brands có sản phẩm (đã có) ─────────────────────────────────────────
    @Query(value = """
        SELECT
            b.brand_id,
            b.name,
            b.slug,
            b.logo_url,
            COUNT(p.product_id) AS product_count
        FROM   brands b
        JOIN   products p ON p.brand_id = b.brand_id AND p.is_active = 1
        WHERE  b.is_active = 1
        GROUP  BY b.brand_id, b.name, b.slug, b.logo_url
        ORDER  BY COUNT(p.product_id) DESC
        """, nativeQuery = true)
    List<Object[]> findActiveBrandsWithProducts();

    // ─── Tổng số sản phẩm active (đã có) ─────────────────────────────────────
    @Query(value = "SELECT COUNT(*) FROM products WHERE is_active = 1",
            nativeQuery = true)
    long countActiveProducts();
}