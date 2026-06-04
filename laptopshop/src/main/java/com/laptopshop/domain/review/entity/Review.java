package com.laptopshop.domain.review.entity;

import com.laptopshop.domain.review.enums.ReviewStatus;
import com.laptopshop.domain.user.entity.User;
import com.laptopshop.domain.order.entity.OrderItem;
import com.laptopshop.domain.catalog.entity.Product;
import com.laptopshop.domain.store.entity.Staff;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Table(
        name = "reviews",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_review_user_item",
                        columnNames = {"user_id", "order_item_id"}
                )
        },
        indexes = {
                @Index(name = "idx_review_product",  columnList = "product_id"),
                @Index(name = "idx_review_status",   columnList = "status"),
                @Index(name = "idx_review_created",  columnList = "created_at")
        }
)
@Entity
@Getter
@Setter
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_review_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_review_product"))
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id",
            foreignKey = @ForeignKey(name = "fk_review_order_item"))
    private OrderItem orderItem;

    /** Staff đã reply — null nếu chưa reply */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replied_by",
            foreignKey = @ForeignKey(name = "fk_review_staff"))
    private Staff repliedBy;

    @Column(nullable = false)
    private Integer rating; // 1–5

    /** Tiêu đề review (mới thêm) */
    @Column(name = "title", length = 255)
    private String title;

    /**
     * Nội dung đầy đủ của review.
     * Đổi tên từ `comment` → `text` cho nhất quán với API doc.
     * Giữ cột `comment` trong DB bằng @Column(name="comment") để không cần migration ngay.
     */
    @Column(name = "comment", columnDefinition = "TEXT")
    private String text;

    /**
     * Trạng thái review:
     *   PENDING  — mới tạo, chờ duyệt
     *   APPROVED — đã duyệt, hiển thị công khai
     *   HIDDEN   — bị ẩn bởi admin/staff
     *
     * Thay thế cặp (isVerified + isVisible).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ReviewStatus status = ReviewStatus.PENDING;

    /** @Deprecated — dùng status thay thế; giữ để backward compat */
    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;

    /** @Deprecated — dùng status thay thế; giữ để backward compat */
    @Column(name = "is_visible", nullable = false)
    private Boolean isVisible = true;

    @Column(name = "reply_text", columnDefinition = "TEXT")
    private String replyText;

    @Column(name = "replied_at")
    private LocalDateTime repliedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Danh sách ảnh đính kèm review */
    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReviewImage> images;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) this.status = ReviewStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}