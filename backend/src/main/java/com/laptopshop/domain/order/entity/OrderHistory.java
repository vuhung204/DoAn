package com.laptopshop.domain.order.entity;

import com.laptopshop.domain.order.enums.OrderStatus;
import com.laptopshop.domain.store.entity.Staff;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Table(
        name = "order_history",
        indexes = {
                @Index(name = "idx_oh_order", columnList = "order_id"),
                @Index(name = "idx_oh_created", columnList = "created_at")
        }
)
@Entity
@Getter
@Setter
public class OrderHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_oh_order"))
    private Order order;

    /**
     * Trạng thái trước khi thay đổi. Null nếu là bản ghi tạo đơn lần đầu.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", length = 30)
    private OrderStatus oldStatus;

    /**
     * Trạng thái mới sau khi thay đổi.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private OrderStatus newStatus;

    /**
     * Staff thực hiện thay đổi. Null nếu do hệ thống tự động.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id",
            foreignKey = @ForeignKey(name = "fk_oh_staff"))
    private Staff staff;

    @Column(name = "staff_note", columnDefinition = "TEXT")
    private String staffNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
