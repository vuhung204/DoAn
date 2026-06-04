package com.laptopshop.application.admin.brand.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Response DTO đầy đủ cho Brand — dùng cho detail và list.
 * productCount: số sản phẩm thuộc brand (LEFT JOIN COUNT).
 */
@Getter
@AllArgsConstructor
public class BrandDto {
    private Long id;
    private String name;
    private String slug;
    private String logoUrl;
    private String description;
    private String website;
    private Boolean active;
    /** Số sản phẩm thuộc brand (tất cả trạng thái) */
    private Integer productCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
