package com.laptopshop.domain.order.repository;

import com.laptopshop.domain.order.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findAllByUserId(Long userId);
    Optional<Wishlist> findByUserIdAndProductId(Long userId, Long productId);
    boolean existsByUserIdAndProductId(Long userId, Long productId);
    void deleteByUserIdAndProductId(Long userId, Long productId);

    /**
     * Fetch wishlist kèm product + brand + images trong 1 query (tránh N+1).
     * Dùng cho UserDashboardService và WishlistService.
     */
    @Query("""
            SELECT w FROM Wishlist w
            JOIN FETCH w.product p
            LEFT JOIN FETCH p.brand
            LEFT JOIN FETCH p.images
            WHERE w.user.id = :userId
            ORDER BY w.addedAt DESC
            """)
    List<Wishlist> findByUserIdWithProduct(@Param("userId") Long userId);
}
