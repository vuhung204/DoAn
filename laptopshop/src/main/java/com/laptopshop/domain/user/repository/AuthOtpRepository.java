package com.laptopshop.domain.user.repository;

import com.laptopshop.domain.user.entity.AuthOtp;
import com.laptopshop.domain.user.enums.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface AuthOtpRepository extends JpaRepository<AuthOtp, Long> {

    /** Lấy OTP còn hiệu lực (chưa dùng, chưa hết hạn) theo email + purpose */
    @Query("""
        SELECT o FROM AuthOtp o
        WHERE o.email   = :email
          AND o.purpose = :purpose
          AND o.usedAt  IS NULL
          AND o.expiresAt > :now
        ORDER BY o.createdAt DESC
        LIMIT 1
        """)
    Optional<AuthOtp> findValidOtp(
            @Param("email")   String email,
            @Param("purpose") OtpPurpose purpose,
            @Param("now")     LocalDateTime now
    );

    /** Vô hiệu hoá tất cả OTP cũ của email + purpose (tránh dùng lại) */
    @Modifying
    @Query("""
        UPDATE AuthOtp o
        SET o.usedAt = :now
        WHERE o.email   = :email
          AND o.purpose = :purpose
          AND o.usedAt  IS NULL
        """)
    void invalidateAll(
            @Param("email")   String email,
            @Param("purpose") OtpPurpose purpose,
            @Param("now")     LocalDateTime now
    );
}
