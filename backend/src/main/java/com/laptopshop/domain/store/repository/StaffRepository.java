package com.laptopshop.domain.store.repository;

import com.laptopshop.domain.store.entity.Staff;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff,Long> {
    Optional<Staff> findByEmail(String email);

    @Query("""
            SELECT s FROM Staff s
            JOIN FETCH s.role r
            JOIN FETCH s.store st
            WHERE s.email = :email
            """)
    Optional<Staff> findByEmailWithRoleAndStore(@Param("email") String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long excludeId);

    /** Load staff kèm store + role (tránh N+1 cho detail). */
    @EntityGraph(attributePaths = {"store", "role"})
    Optional<Staff> findWithRelationsById(Long id);

    /**
     * Tìm kiếm staff với filter.
     * storeId: ID chi nhánh (nullable).
     * roleName: tên role (nullable).
     * active: true/false/null.
     */
    @Query(
            value = """
            SELECT st FROM Staff st
            JOIN FETCH st.store  s
            JOIN FETCH st.role   r
            WHERE (:q        IS NULL
                   OR LOWER(st.fullName) LIKE LOWER(CONCAT('%',:q,'%'))
                   OR LOWER(st.email)    LIKE LOWER(CONCAT('%',:q,'%')))
              AND (:storeId  IS NULL OR s.id     = :storeId)
              AND (:roleName IS NULL OR r.name   = :roleName)
              AND (:active   IS NULL OR st.isActive = :active)
            ORDER BY st.fullName ASC
            """,
            countQuery = """
            SELECT COUNT(st) FROM Staff st
            JOIN st.store s
            JOIN st.role  r
            WHERE (:q        IS NULL
                   OR LOWER(st.fullName) LIKE LOWER(CONCAT('%',:q,'%'))
                   OR LOWER(st.email)    LIKE LOWER(CONCAT('%',:q,'%')))
              AND (:storeId  IS NULL OR s.id   = :storeId)
              AND (:roleName IS NULL OR r.name = :roleName)
              AND (:active   IS NULL OR st.isActive = :active)
            """)
    Page<Staff> searchStaff(
            @Param("q")        String  q,
            @Param("storeId")  Long    storeId,
            @Param("roleName") String  roleName,
            @Param("active")   Boolean active,
            Pageable pageable
    );

    /** Export: toàn bộ theo filter. */
    @Query("""
            SELECT st FROM Staff st
            JOIN FETCH st.store s
            JOIN FETCH st.role  r
            WHERE (:storeId  IS NULL OR s.id   = :storeId)
              AND (:roleName IS NULL OR r.name = :roleName)
              AND (:active   IS NULL OR st.isActive = :active)
            ORDER BY st.fullName ASC
            """)
    List<Staff> findForExport(
            @Param("storeId")  Long    storeId,
            @Param("roleName") String  roleName,
            @Param("active")   Boolean active
    );

    @Modifying
    @Query("UPDATE Staff st SET st.isActive = :active WHERE st.id = :id")
    int setActive(@Param("id") Long id, @Param("active") boolean active);

    /** Đếm staff của một chi nhánh (dùng khi xoá store). */
    @Query("SELECT COUNT(st) FROM Staff st WHERE st.store.id = :storeId")
    long countByStoreId(@Param("storeId") Long storeId);
}
