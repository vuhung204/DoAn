package com.laptopshop.domain.store.repository;

import com.laptopshop.domain.store.entity.Store;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StoreRepository extends JpaRepository<Store, Long> {
    Optional<Store> findFirstByIsActiveTrueOrderByIdAsc();

    Optional<Store> findByName(String name);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long excludeId);

    /**
     * Lấy tất cả chi nhánh đang hoạt động.
     */
    @Query("SELECT s FROM Store s WHERE s.isActive = true ORDER BY s.name")
    List<Store> findAllActive();

    /**
     * Tìm kiếm store với filter.
     * status: "active" → isActive=true, "inactive" → isActive=false, null → tất cả.
     */
    @Query(
            value = """
            SELECT s FROM Store s
            WHERE (:q IS NULL
                   OR LOWER(s.name)    LIKE LOWER(CONCAT('%',:q,'%'))
                   OR LOWER(s.address) LIKE LOWER(CONCAT('%',:q,'%')))
              AND (:active IS NULL OR s.isActive = :active)
            ORDER BY s.name ASC
            """,
            countQuery = """
            SELECT COUNT(s) FROM Store s
            WHERE (:q IS NULL
                   OR LOWER(s.name)    LIKE LOWER(CONCAT('%',:q,'%'))
                   OR LOWER(s.address) LIKE LOWER(CONCAT('%',:q,'%')))
              AND (:active IS NULL OR s.isActive = :active)
            """)
    Page<Store> searchStores(
            @Param("q")      String  q,
            @Param("active") Boolean active,
            Pageable pageable
    );

    /** Export: toàn bộ không phân trang. */
    @Query("""
            SELECT s FROM Store s
            WHERE (:active IS NULL OR s.isActive = :active)
            ORDER BY s.name ASC
            """)
    List<Store> findForExport(@Param("active") Boolean active);

    @Modifying
    @Query("UPDATE Store s SET s.isActive = :active WHERE s.id = :id")
    int setActive(@Param("id") Long id, @Param("active") boolean active);
}
