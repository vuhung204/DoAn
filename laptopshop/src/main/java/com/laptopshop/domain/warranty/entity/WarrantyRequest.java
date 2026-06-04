package com.laptopshop.domain.warranty.entity;

import com.laptopshop.domain.warranty.enums.WarrantyStatus;
import com.laptopshop.domain.user.entity.User;
import com.laptopshop.domain.order.entity.Order;
import com.laptopshop.domain.order.entity.OrderItem;
import com.laptopshop.domain.store.entity.Staff;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Table(
        name = "warranty_requests",
        indexes = {
                @Index(name = "idx_warranty_user",   columnList = "user_id"),
                @Index(name = "idx_warranty_order",  columnList = "order_id"),
                @Index(name = "idx_warranty_status", columnList = "status"),
                @Index(name = "idx_warranty_created", columnList = "created_at")
        }
)
@Entity
@Getter
@Setter
public class WarrantyRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "warranty_id")
    private Long id;

    // ── Relations ─────────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_warranty_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_warranty_order"))
    private Order order;

    /**
     * Sản phẩm cụ thể trong đơn hàng được yêu cầu bảo hành.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_warranty_order_item"))
    private OrderItem orderItem;

    /**
     * Staff tiếp nhận / xử lý yêu cầu. Null nếu chưa có ai nhận.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "handled_by",
            foreignKey = @ForeignKey(name = "fk_warranty_staff"))
    private Staff handledBy;

    // ── Core fields ───────────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WarrantyStatus status = WarrantyStatus.PENDING;

    /**
     * Mô tả lỗi / vấn đề của máy do khách nhập.
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String issueDescription;

    /**
     * Ghi chú kỹ thuật của staff (kết quả kiểm tra, linh kiện thay...).
     */
    @Column(name = "staff_note", columnDefinition = "TEXT")
    private String staffNote;

    /**
     * Lý do từ chối (dùng khi status = REJECTED).
     */
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    // ── Timestamps ────────────────────────────────────────────────────────────

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Thời điểm staff duyệt / từ chối yêu cầu.
     */
    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    /**
     * Thời điểm trả máy lại cho khách (status = COMPLETED).
     */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) this.status = WarrantyStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
