package com.laptopshop.application.customer.catalog.dto;

import com.laptopshop.domain.catalog.entity.Category;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Getter
public class CategoryResponse {
    private Long id;
    private String name;
    private String slug;
    private Long parentId;
    private Integer sortOrder;
    private Boolean isActive;

    /** Danh mục con — được populate sau khi build tree */
    private List<CategoryResponse> children;

    // ─── Private constructor — dùng static factory ────────────────────────────

    private CategoryResponse() {}

    /**
     * Tạo DTO từ entity Category.
     * children khởi tạo là list rỗng, sẽ được gắn thêm bởi CatalogService.
     */
    public static CategoryResponse from(Category c) {
        CategoryResponse dto = new CategoryResponse();
        dto.id         = c.getId();
        dto.name       = c.getName();
        dto.slug       = c.getSlug();
        dto.parentId   = c.getParent() != null ? c.getParent().getId() : null;
        dto.sortOrder  = c.getSortOrder();
        dto.isActive   = c.getIsActive();
        dto.children   = new ArrayList<>();
        return dto;
    }

    /** Cho phép CatalogService gắn children sau khi build tree */
    public void addChild(CategoryResponse child) {
        this.children.add(child);
    }
}
