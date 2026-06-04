package com.laptopshop.application.customer.catalog.dto;

import com.laptopshop.domain.catalog.entity.Product;
import com.laptopshop.domain.catalog.entity.ProductImage;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Dữ liệu một sản phẩm trong danh sách kết quả tìm kiếm.
 * Chỉ chứa các trường cần thiết cho ProductCard ở FE.
 */
@Getter
@Builder
public class ProductSearchResponse {

    private Long       id;
    private String     name;
    private String     brandName;
    private Long       brandId;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private String     image;

    // Spec
    private String cpu;
    private String ram;
    private String storage;
    private String display;
    private String gpu;

    // Rating — null khi chưa có review nào được duyệt
    private Double avgRating;
    private Long   reviewCount;

    // ─── Factory ─────────────────────────────────────────────────────────────

    public static ProductSearchResponse from(Product p) {
        String img = null;
        if (p.getImages() != null) {
            img = p.getImages().stream()
                    .filter(ProductImage::getIsPrimary)
                    .findFirst()
                    .map(ProductImage::getImageUrl)
                    .orElse(p.getImages().isEmpty() ? null : p.getImages().get(0).getImageUrl());
        }

        boolean hasSale = p.getSalePrice() != null
                && p.getSalePrice().compareTo(BigDecimal.ZERO) > 0;

        var spec = p.getSpec();

        return ProductSearchResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .brandName(p.getBrand() != null ? p.getBrand().getName() : null)
                .brandId(p.getBrand()   != null ? p.getBrand().getId()   : null)
                .price(hasSale ? p.getSalePrice() : p.getBasePrice())
                .originalPrice(hasSale ? p.getBasePrice() : null)
                .image(img)
                .cpu    (spec != null ? spec.getCpu()     : null)
                .ram    (spec != null ? spec.getRam()     : null)
                .storage(spec != null ? spec.getStorage() : null)
                .display(spec != null ? spec.getDisplay() : null)
                .gpu    (spec != null ? spec.getGpu()     : null)
                .avgRating(null)
                .reviewCount(0L)
                .build();
    }

    /**
     * Trả về bản copy với rating đã enrich.
     * Gọi sau khi có kết quả từ findRatingStatsByProductIds().
     */
    public ProductSearchResponse withRating(Double avg, Long count) {
        double rounded = avg != null
                ? new BigDecimal(avg).setScale(1, RoundingMode.HALF_UP).doubleValue()
                : 0.0;
        return ProductSearchResponse.builder()
                .id(this.id).name(this.name).brandName(this.brandName).brandId(this.brandId)
                .price(this.price).originalPrice(this.originalPrice).image(this.image)
                .cpu(this.cpu).ram(this.ram).storage(this.storage).display(this.display).gpu(this.gpu)
                .avgRating(avg != null ? rounded : null)
                .reviewCount(count != null ? count : 0L)
                .build();
    }
}
