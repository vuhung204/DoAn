package com.laptopshop.domain.order.repository;

import com.laptopshop.domain.order.entity.Promotion;
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
public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    @Query("SELECT p FROM Promotion p WHERE p.code = :code AND p.isActive = true AND p.startsAt <= :now AND p.endsAt >= :now")
    Optional<Promotion> findActiveByCode(String code, LocalDateTime now);

    Optional<Promotion> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long excludeId);

    boolean existsByCodeIgnoreCase(String code);

    /**
     * Tìm kiếm promotion với filter động.
     * status được tính theo ngày: upcoming / active / expired / inactive (manual).
     * Object[]: [0..10] → map sang PromotionListDto
     */
    @Query(value = """
            SELECT
                p.promotion_id,
                p.code,
                p.name,
                p.discount_type,
                p.discount_value,
                p.max_discount,
                DATE(p.starts_at)  AS start_date,
                DATE(p.ends_at)    AS end_date,
                p.used_count,
                p.max_uses,
                CASE
                    WHEN p.is_active = 0               THEN 'inactive'
                    WHEN NOW() < p.starts_at            THEN 'upcoming'
                    WHEN NOW() > p.ends_at              THEN 'expired'
                    ELSE 'active'
                END AS status
            FROM promotions p
            WHERE (:q IS NULL
                   OR p.code LIKE CONCAT('%',:q,'%')
                   OR p.name LIKE CONCAT('%',:q,'%'))
              AND (:type IS NULL OR p.discount_type = :type)
              AND (:status IS NULL OR
                    CASE
                        WHEN p.is_active = 0         THEN 'inactive'
                        WHEN NOW() < p.starts_at     THEN 'upcoming'
                        WHEN NOW() > p.ends_at       THEN 'expired'
                        ELSE 'active'
                    END = :status)
              AND (:from IS NULL OR p.starts_at >= :from)
              AND (:to   IS NULL OR p.ends_at   <= :to)
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM promotions p
            WHERE (:q IS NULL
                   OR p.code LIKE CONCAT('%',:q,'%')
                   OR p.name LIKE CONCAT('%',:q,'%'))
              AND (:type IS NULL OR p.discount_type = :type)
              AND (:status IS NULL OR
                    CASE
                        WHEN p.is_active = 0         THEN 'inactive'
                        WHEN NOW() < p.starts_at     THEN 'upcoming'
                        WHEN NOW() > p.ends_at       THEN 'expired'
                        ELSE 'active'
                    END = :status)
              AND (:from IS NULL OR p.starts_at >= :from)
              AND (:to   IS NULL OR p.ends_at   <= :to)
            """,
            nativeQuery = true)
    Page<Object[]> searchPromotions(
            @Param("q")      String q,
            @Param("status") String status,
            @Param("type")   String type,
            @Param("from")   LocalDateTime from,
            @Param("to")     LocalDateTime to,
            Pageable pageable
    );

    /**
     * Load chi tiết promotion kèm promotionProducts + product info.
     */
    @Query("""
            SELECT p FROM Promotion p
            LEFT JOIN FETCH p.promotionProducts pp
            LEFT JOIN FETCH pp.product pr
            WHERE p.id = :id
            """)
    Optional<Promotion> findDetailById(@Param("id") Long id);

    /**
     * Export: toàn bộ không phân trang, cùng filter.
     */
    @Query(value = """
            SELECT
                p.promotion_id, p.code, p.name,
                p.discount_type, p.discount_value, p.max_discount,
                DATE(p.starts_at), DATE(p.ends_at),
                p.used_count, p.max_uses,
                CASE
                    WHEN p.is_active = 0         THEN 'inactive'
                    WHEN NOW() < p.starts_at     THEN 'upcoming'
                    WHEN NOW() > p.ends_at       THEN 'expired'
                    ELSE 'active'
                END AS status
            FROM promotions p
            WHERE (:q      IS NULL OR p.code LIKE CONCAT('%',:q,'%')
                                   OR p.name LIKE CONCAT('%',:q,'%'))
              AND (:type   IS NULL OR p.discount_type = :type)
              AND (:from   IS NULL OR p.starts_at >= :from)
              AND (:to     IS NULL OR p.ends_at   <= :to)
            ORDER BY p.created_at DESC
            """, nativeQuery = true)
    List<Object[]> findForExport(
            @Param("q")    String q,
            @Param("type") String type,
            @Param("from") LocalDateTime from,
            @Param("to")   LocalDateTime to
    );

    /**
     * Tăng used_count nguyên tử — chỉ tăng nếu còn quota.
     * Trả về số rows affected: 0 = đã hết lượt dùng.
     */
    @Modifying
    @Query(value = """
            UPDATE promotions
            SET used_count = used_count + :delta
            WHERE promotion_id = :id
              AND (max_uses IS NULL OR max_uses = 0
                   OR used_count + :delta <= max_uses)
            """, nativeQuery = true)
    int incrementUsedCount(@Param("id") Long id, @Param("delta") int delta);

    /**
     * Bật/tắt promotion.
     */
    @Modifying
    @Query("UPDATE Promotion p SET p.isActive = :active WHERE p.id = :id")
    int setActive(@Param("id") Long id, @Param("active") boolean active);
}
