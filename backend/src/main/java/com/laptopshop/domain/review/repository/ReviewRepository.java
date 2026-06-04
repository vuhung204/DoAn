package com.laptopshop.domain.review.repository;

import com.laptopshop.domain.review.entity.Review;
import com.laptopshop.domain.review.enums.ReviewStatus;
import com.laptopshop.domain.store.entity.Staff;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findAllByProductIdAndIsVisibleTrue(Long productId, Pageable pageable);

    boolean existsByUserIdAndOrderItemId(Long userId, Long orderItemId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId AND r.isVisible = true")
    Optional<Double> findAverageRatingByProductId(@Param("productId") Long productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId AND r.isVisible = true")
    Long countByProductId(@Param("productId") Long productId);

    // ══════════════════════════════════════════════════════════════════════
    // SEARCH + PAGING — danh sách review (native để dùng LEFT(), LIKE, COUNT images)
    // ══════════════════════════════════════════════════════════════════════

    @Query(value = """
            SELECT r.review_id,
                   r.product_id,
                   p.name                           AS product_name,
                   r.user_id,
                   u.full_name                      AS customer_name,
                   u.email,
                   r.rating,
                   r.title,
                   LEFT(r.comment, 250)             AS short_text,
                   0                                AS image_count,
                   r.created_at,
                   r.status
            FROM reviews r
            JOIN products p  ON r.product_id = p.product_id
            LEFT JOIN users u ON r.user_id    = u.user_id
            WHERE (:q IS NULL OR (
                      p.name       LIKE CONCAT('%',:q,'%')
                   OR u.full_name  LIKE CONCAT('%',:q,'%')
                   OR u.email      LIKE CONCAT('%',:q,'%')
            ))
              AND (:status IS NULL OR r.status = :status)
              AND (:rating IS NULL OR r.rating = :rating)
              AND (:start  IS NULL OR r.created_at >= :start)
              AND (:end    IS NULL OR r.created_at <= :end)
            GROUP BY r.review_id, r.product_id, p.name,
                     r.user_id, u.full_name, u.email,
                     r.rating, r.title, r.comment, r.created_at, r.status
            """,
            countQuery = """
            SELECT COUNT(DISTINCT r.review_id)
            FROM reviews r
            JOIN products p  ON r.product_id = p.product_id
            LEFT JOIN users u ON r.user_id   = u.user_id
            WHERE (:q IS NULL OR (
                      p.name      LIKE CONCAT('%',:q,'%')
                   OR u.full_name LIKE CONCAT('%',:q,'%')
                   OR u.email     LIKE CONCAT('%',:q,'%')
            ))
              AND (:status IS NULL OR r.status = :status)
              AND (:rating IS NULL OR r.rating = :rating)
              AND (:start  IS NULL OR r.created_at >= :start)
              AND (:end    IS NULL OR r.created_at <= :end)
            """,
            nativeQuery = true)
    Page<Object[]> searchReviews(
            @Param("q") String q,
            @Param("status") String status,
            @Param("rating") Integer rating,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable
    );

    @Query("""
            SELECT r FROM Review r
            LEFT JOIN FETCH r.images
            LEFT JOIN FETCH r.repliedBy
            LEFT JOIN FETCH r.product
            LEFT JOIN FETCH r.user
            LEFT JOIN FETCH r.orderItem oi
            LEFT JOIN FETCH oi.order o
            WHERE r.id = :id
            """)
    Optional<Review> findByIdWithDetails(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Review r SET r.status = :status, r.updatedAt = :now WHERE r.id = :id")
    int updateStatus(
            @Param("id") Long id,
            @Param("status") ReviewStatus status,
            @Param("now") LocalDateTime now
    );

    @Modifying
    @Query("""
            UPDATE Review r
            SET r.replyText  = :text,
                r.repliedBy  = :staff,
                r.repliedAt  = :time,
                r.updatedAt  = :time
            WHERE r.id = :id
            """)
    int saveReply(
            @Param("id") Long id,
            @Param("text") String text,
            @Param("staff") Staff staff,
            @Param("time") LocalDateTime time
    );

    @Query(value = """
            SELECT r.status, COUNT(*) AS cnt
            FROM reviews r
            WHERE r.created_at BETWEEN :start AND :end
            GROUP BY r.status
            """, nativeQuery = true)
    List<Object[]> countByStatus(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query(value = """
            SELECT r.rating, COUNT(*) AS cnt
            FROM reviews r
            WHERE r.created_at BETWEEN :start AND :end
            GROUP BY r.rating
            ORDER BY r.rating DESC
            """, nativeQuery = true)
    List<Object[]> countByRating(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query(value = """
            SELECT r.review_id,
                   p.name                           AS product_name,
                   u.full_name                      AS customer_name,
                   u.email,
                   r.rating,
                   r.title,
                   r.comment                        AS full_text,
                   0                                AS image_count,
                   r.status,
                   r.created_at,
                   r.reply_text,
                   r.replied_at
            FROM reviews r
            JOIN products p  ON r.product_id = p.product_id
            LEFT JOIN users u ON r.user_id   = u.user_id
            WHERE (:status IS NULL OR r.status = :status)
              AND (:rating IS NULL OR r.rating = :rating)
              AND (:start  IS NULL OR r.created_at >= :start)
              AND (:end    IS NULL OR r.created_at <= :end)
            GROUP BY r.review_id, p.name, u.full_name, u.email,
                     r.rating, r.title, r.comment, r.status,
                     r.created_at, r.reply_text, r.replied_at
            ORDER BY r.created_at DESC
            """, nativeQuery = true)
    List<Object[]> findForExport(
            @Param("status") String status,
            @Param("rating") Integer rating,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    /**
     * Lấy danh sách orderItemId mà user đã review trong 1 đơn hàng cụ thể.
     * Dùng để đánh dấu reviewed=true trên từng item khi trả OrderResponse.
     */
    @Query("""
    SELECT r.orderItem.id
    FROM Review r
    WHERE r.user.id = :userId
      AND r.orderItem.id IN (
          SELECT oi.id FROM OrderItem oi WHERE oi.order.id = :orderId
      )
    """)
    List<Long> findReviewedOrderItemIds(
            @Param("userId")  Long userId,
            @Param("orderId") Long orderId
    );
}
