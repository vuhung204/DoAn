package com.laptopshop.domain.order.entity;

import com.laptopshop.domain.order.enums.DiscountType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;


@Table(
        name = "promotions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_promo_code", columnNames = "code")
        },
        indexes = {
                @Index(name = "idx_promo_dates",  columnList = "starts_at, ends_at"),
                @Index(name = "idx_promo_active", columnList = "is_active")
        }
)
@Entity
@Getter
@Setter
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "promotion_id")
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    private DiscountType discountType = DiscountType.PERCENT;

    @Column(name = "discount_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "max_discount", precision = 15, scale = 0)
    private BigDecimal maxDiscount;

    @Column(name = "min_order_amount", nullable = false, precision = 15, scale = 0)
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    /** Số lượng sản phẩm tối thiểu trong đơn để áp dụng. 0 = không yêu cầu. */
    @Column(name = "min_qty", nullable = false)
    private Integer minQty = 0;

    @Column(name = "max_uses")
    private Integer maxUses;

    @Column(name = "used_count", nullable = false)
    private Integer usedCount = 0;

    /** Số lần tối đa một user được dùng mã này. null = không giới hạn. */
    @Column(name = "max_uses_per_user")
    private Integer maxUsesPerUser;

    /**
     * Chế độ áp dụng:
     *   all    → áp dụng cho tất cả sản phẩm
     *   select → chỉ áp dụng cho sản phẩm/danh mục được chọn
     */
    @Column(name = "apply_mode", nullable = false, length = 20)
    private String applyMode = "all";

    /**
     * Danh sách category IDs được áp dụng (JSON array), dùng khi applyMode=select.
     * Ví dụ: "[1, 2, 5]"
     */
    @Column(name = "category_ids", columnDefinition = "JSON")
    private String categoryIds;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "starts_at", nullable = false)
    private LocalDateTime startsAt;

    @Column(name = "ends_at", nullable = false)
    private LocalDateTime endsAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @OneToMany(mappedBy = "promotion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PromotionProduct> promotionProducts;
}
