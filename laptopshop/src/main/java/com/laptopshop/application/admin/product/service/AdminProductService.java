package com.laptopshop.application.admin.product.service;

import com.laptopshop.application.admin.dashboard.dto.PageDto;
import com.laptopshop.application.admin.product.dto.*;
import org.springframework.data.domain.Pageable;

public interface AdminProductService {
    /**
     * Tìm kiếm + filter sản phẩm (server-side paging).
     * status = "visible" | "hidden" | "all" | null = all
     */
    PageDto<ProductListDto> searchProducts(String q, Long brandId, Long categoryId,
                                           String status, Pageable pageable);

    /** Chi tiết đầy đủ 1 sản phẩm kèm specs + images */
    ProductDetailDto getProduct(Long id);

    /**
     * Tạo sản phẩm mới.
     * Validate SKU unique, tạo ProductSpec, ProductImage, StoreInventory records.
     */
    ProductDetailDto createProduct(CreateProductRequestDto dto);

    /**
     * Cập nhật sản phẩm.
     * Chỉ update field không null; nếu imageUrls không null → replace toàn bộ ảnh.
     */
    ProductDetailDto updateProduct(Long id, UpdateProductRequestDto dto);

    /** Xóa vĩnh viễn sản phẩm (cascade xóa spec, images, inventory). */
    void deleteProduct(Long id);

    /** Bật/tắt hiển thị sản phẩm (isActive). */
    void setVisibility(Long id, boolean visible);

    /**
     * Metadata cho filter bar: brands, categories, status options.
     */
    ProductFiltersMetaDto getFiltersMeta();

    /** Cập nhật tồn kho (stock + minStock) cho product. */
    void updateStock(Long productId, Integer stock, Integer minStock);

    /** Xuất danh sách sản phẩm ra Excel. */
    byte[] exportProducts(ProductExportRequestDto req);
}
