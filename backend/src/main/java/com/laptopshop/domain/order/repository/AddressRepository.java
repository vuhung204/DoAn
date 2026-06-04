package com.laptopshop.domain.order.repository;

import com.laptopshop.domain.order.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findAllByUserId(Long userId);
    Optional<Address> findByIdAndUserId(Long id, Long userId);
    Optional<Address> findByUserIdAndIsDefaultTrue(Long userId);

    /**
     * Tất cả địa chỉ của 1 user, địa chỉ mặc định lên đầu.
     */
    @Query("""
            SELECT a FROM Address a
            WHERE a.user.id = :userId
            ORDER BY a.isDefault DESC, a.id ASC
            """)
    List<Address> findByUserId(@Param("userId") Long userId);

    /**
     * Địa chỉ mặc định của user — dùng cho CustomerDetail.primaryAddress.
     */
    @Query("""
            SELECT a FROM Address a
            WHERE a.user.id = :userId
              AND a.isDefault = true
            """)
    Optional<Address> findDefaultByUserId(@Param("userId") Long userId);
}
