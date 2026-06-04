package com.laptopshop.domain.notification.repository;

import com.laptopshop.domain.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** Danh sách thông báo của user, mới nhất trước. */
    Page<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** Đếm số chưa đọc — dùng cho badge. */
    long countByUser_IdAndIsRead(Long userId, Boolean isRead);

    /** Đánh dấu tất cả đã đọc. */
    @Modifying
    @Query("""
            UPDATE Notification n
            SET n.isRead = true
            WHERE n.user.id = :userId
              AND n.isRead  = false
            """)
    void markAllRead(@Param("userId") Long userId);

    /** Đánh dấu 1 thông báo đã đọc (kiểm tra ownership bằng userId). */
    @Modifying
    @Query("""
            UPDATE Notification n
            SET n.isRead = true
            WHERE n.id      = :id
              AND n.user.id = :userId
            """)
    void markOneRead(@Param("id") Long id, @Param("userId") Long userId);
}
