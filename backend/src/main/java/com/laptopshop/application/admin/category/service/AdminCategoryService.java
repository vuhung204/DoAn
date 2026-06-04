package com.laptopshop.application.admin.category.service;

import com.laptopshop.application.admin.category.dto.*;
import com.laptopshop.application.admin.refund.dto.PageDto;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AdminCategoryService {

    /** Cây danh mục đầy đủ để render CategoryTree. */
    List<CategoryTreeDto> getCategoryTree();

    /** Danh sách phẳng có filter + phân trang cho admin grid. */
    PageDto<CategoryDto> listCategories(String q, Boolean visible, Pageable pageable);

    CategoryDto createCategory(CreateCategoryRequestDto req);

    CategoryDto updateCategory(Long id, UpdateCategoryRequestDto req);

    /**
     * Xoá danh mục.
     * force=false → ném lỗi nếu có con hoặc có sản phẩm.
     * force=true  → xoá cascade toàn bộ descendants.
     */
    void deleteCategory(Long id, boolean force);

    void setVisibility(Long id, boolean visible);

    /** Set sortOrder cho từng category theo thứ tự trong orderedCategoryIds. */
    void reorderCategories(ReorderCategoryRequestDto req);

    byte[] exportCategories();
}
