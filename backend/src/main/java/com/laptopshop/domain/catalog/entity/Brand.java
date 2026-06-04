package com.laptopshop.domain.catalog.entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Table(
        name = "brands",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_brand_name", columnNames = "name"),
                @UniqueConstraint(name = "uq_brand_slug", columnNames = "slug")
        },
        indexes = {
                @Index(name = "idx_brand_active", columnList = "is_active")
        }
)
@Entity
@Getter
@Setter
public class Brand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "brand_id")
    private Long id;

    @Column(nullable = false)
    private String name;

    /** URL-friendly identifier, ví dụ: "dell", "apple", "lenovo" */
    @Column(unique = true, length = 255)
    private String slug;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Website chính thức của brand */
    @Column(length = 500)
    private String website;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "brand")
    private List<Product> products;

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
