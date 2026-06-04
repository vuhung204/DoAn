package com.laptopshop.domain.notification.entity;

import com.laptopshop.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "notifications",
        indexes = {
                @Index(name = "idx_notif_user_read", columnList = "user_id, is_read"),
                @Index(name = "idx_notif_created",   columnList = "created_at")
        }
)
@Getter
@Setter
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_notif_user"))
    private User user;

    /**
     * ORDER_STATUS | RETURN_STATUS | REFUND_COMPLETED
     */
    @Column(nullable = false, length = 50)
    private String type;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    /** order_id hoặc return_id tùy reference_type */
    @Column(name = "reference_id")
    private Long referenceId;

    /** ORDER | RETURN */
    @Column(name = "reference_type", length = 30)
    private String referenceType;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
