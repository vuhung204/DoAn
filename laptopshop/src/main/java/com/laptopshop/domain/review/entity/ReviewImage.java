package com.laptopshop.domain.review.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Table(
        name = "review_images",
        indexes = {
                @Index(name = "idx_ri_review", columnList = "review_id")
        }
)
@Entity
@Getter
@Setter
public class ReviewImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "image_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_ri_review"))
    private Review review;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
