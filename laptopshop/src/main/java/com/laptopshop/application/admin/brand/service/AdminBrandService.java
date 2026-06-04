package com.laptopshop.application.admin.brand.service;

import com.laptopshop.application.admin.brand.dto.*;
import com.laptopshop.application.admin.dashboard.dto.PageDto;
import org.springframework.data.domain.Pageable;

public interface AdminBrandService {

    /**
     * Danh sách brand phân trang + search + filter.
     * q      = tìm theo name/slug
     * active = null = tất cả
     */
    PageDto<BrandDto> listBrands(String q, Boolean active, Pageable pageable);

    /** Chi tiết 1 brand kèm productCount */
    BrandDto getBrand(Long id);

    /**
     * Tạo brand mới.
     * Validate: name unique, slug unique (tự generate nếu null).
     */
    BrandDto createBrand(CreateBrandRequestDto dto);

    /**
     * Cập nhật brand — partial update (chỉ field != null).
     * Validate slug unique khi thay đổi.
     */
    BrandDto updateBrand(Long id, UpdateBrandRequestDto dto);

    /**
     * Xóa brand.
     * force=false: reject 409 nếu còn sản phẩm.
     * force=true:  reject vẫn — không xóa cascade products (policy mặc định an toàn).
     */
    void deleteBrand(Long id, boolean force);

    /** Bật/tắt active status của brand */
    void setActive(Long id, boolean active);

    /** Stat bar: totalBrands, activeBrands, brandsWithProducts, totalProducts */
    BrandStatsDto getStats();

    /** Xuất danh sách brand ra XLSX hoặc CSV */
    byte[] exportBrands(BrandExportRequestDto req);
}
