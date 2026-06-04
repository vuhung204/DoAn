package com.laptopshop.application.customer.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO cho GET /api/home
 * Gom tất cả dữ liệu homepage vào 1 request duy nhất để giảm số lần call API.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomePageDto {

    /** Sản phẩm nổi bật (top tồn kho) */
    private List<FeaturedProductDto> featuredProducts;

    /** Bán chạy nhất (từ COMPLETED orders) */
    private List<FeaturedProductDto> bestSellingProducts;

    /** Đánh giá cao nhất (avg rating từ APPROVED reviews) */
    private List<FeaturedProductDto> topRatedProducts;

    /** Laptop Gaming (category slug: laptop-gaming) */
    private List<FeaturedProductDto> gamingProducts;

    /** Laptop Văn Phòng (category slug: laptop-van-phong) */
    private List<FeaturedProductDto> officeProducts;

    /** Laptop Đồ Họa (category slug: laptop-do-hoa) */
    private List<FeaturedProductDto> graphicsProducts;

    /** Laptop Mỏng Nhẹ / Ultrabook (category slug: laptop-mong-nhe) */
    private List<FeaturedProductDto> ultrabookProducts;

    /** MacBook (brand slug: apple) */
    private List<FeaturedProductDto> macbookProducts;

    /** Danh mục root */
    private List<CategoryDto> categories;

    /** Thương hiệu có sản phẩm */
    private List<BrandDto> brands;

    /** Tổng số sản phẩm đang active */
    private long totalProducts;
}