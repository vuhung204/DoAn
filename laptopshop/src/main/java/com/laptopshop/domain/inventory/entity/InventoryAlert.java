package com.laptopshop.domain.inventory.entity;

import com.laptopshop.domain.catalog.entity.Product;
import com.laptopshop.domain.store.entity.Store;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Table(
        name = "inventory_alerts",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_alert_store_product",
                        columnNames = {"store_id", "product_id"})
        },
        indexes = {
                @Index(name = "idx_alert_store",    columnList = "store_id"),
                @Index(name = "idx_alert_severity", columnList = "severity")
        }
)
@Entity
@Getter
@Setter
public class InventoryAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alert_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_alert_store"))
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_alert_product"))
    private Product product;

    @Column(nullable = false)
    private Integer stock;

    @Column(name = "min_stock", nullable = false)
    private Integer minStock;

    /**
     * critical  → stock = 0
     * warning   → 0 < stock <= minStock / 2
     * info      → minStock / 2 < stock <= minStock
     */
    @Column(nullable = false, length = 20)
    private String severity;

    @Column(length = 500)
    private String note;

    @Column(name = "is_resolved", nullable = false)
    private Boolean isResolved = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
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
}
