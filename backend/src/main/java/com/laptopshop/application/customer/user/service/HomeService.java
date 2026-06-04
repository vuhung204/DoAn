package com.laptopshop.application.customer.user.service;

import com.laptopshop.application.customer.user.dto.BrandDto;
import com.laptopshop.application.customer.user.dto.CategoryDto;
import com.laptopshop.application.customer.user.dto.FeaturedProductDto;
import com.laptopshop.application.customer.user.dto.HomePageDto;
import com.laptopshop.domain.user.repository.HomeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomeService {

    private final HomeRepository homeRepository;

    // ─── Category slugs (phải khớp với data trong DB) ────────────────────────
    private static final String SLUG_GAMING    = "laptop-gaming";
    private static final String SLUG_OFFICE    = "laptop-van-phong";
    private static final String SLUG_GRAPHICS  = "laptop-do-hoa";
    private static final String SLUG_ULTRABOOK = "laptop-mong-nhe";
    private static final String BRAND_APPLE    = "apple";

    // ─── Giới hạn số sản phẩm mỗi section ────────────────────────────────────
    private static final int FEATURED_LIMIT    = 8;
    private static final int SECTION_LIMIT     = 8;
    private static final int BESTSELLER_LIMIT  = 8;
    private static final int TOP_RATED_LIMIT   = 8;
    private static final int MACBOOK_LIMIT     = 6;

    /**
     * Lấy tất cả dữ liệu cho homepage trong 1 lần gọi.
     * Cache 5 phút.
     */
    @Cacheable(value = "homepage", unless = "#result == null")
    public HomePageDto getHomePage() {
        log.info("Loading homepage data...");

        return HomePageDto.builder()
                // Sections đã có
                .featuredProducts(mapProducts(homeRepository.findFeaturedProducts(FEATURED_LIMIT)))
                .gamingProducts(mapProducts(homeRepository.findProductsByCategorySlug(SLUG_GAMING, SECTION_LIMIT)))
                .officeProducts(mapProducts(homeRepository.findProductsByCategorySlug(SLUG_OFFICE, SECTION_LIMIT)))
                .ultrabookProducts(mapProducts(homeRepository.findProductsByCategorySlug(SLUG_ULTRABOOK, SECTION_LIMIT)))
                // Sections mới
                .bestSellingProducts(mapProducts(homeRepository.findBestSellingProducts(BESTSELLER_LIMIT)))
                .topRatedProducts(mapProducts(homeRepository.findTopRatedProducts(TOP_RATED_LIMIT)))
                .graphicsProducts(mapProducts(homeRepository.findProductsByCategorySlug(SLUG_GRAPHICS, SECTION_LIMIT)))
                .macbookProducts(mapProducts(homeRepository.findProductsByBrandSlug(BRAND_APPLE, MACBOOK_LIMIT)))
                // Meta
                .categories(mapCategories(homeRepository.findRootCategories()))
                .brands(mapBrands(homeRepository.findActiveBrandsWithProducts()))
                .totalProducts(homeRepository.countActiveProducts())
                .build();
    }

    // ─── Mappers ──────────────────────────────────────────────────────────────

    private List<FeaturedProductDto> mapProducts(List<Object[]> rows) {
        return rows.stream().map(r -> FeaturedProductDto.builder()
                .id(toLong(r[0]))
                .name(str(r[1]))
                .slug(str(r[2]))
                .brandName(str(r[3]))
                .categoryName(str(r[4]))
                .categorySlug(str(r[5]))
                .basePrice(toBigDecimal(r[6]))
                .salePrice(toBigDecimal(r[7]))
                .imageUrl(str(r[8]))
                .cpu(str(r[9]))
                .ram(str(r[10]))
                .storage(str(r[11]))
                .display(str(r[12]))
                .gpu(str(r[13]))
                .avgRating(toDouble(r[14]))
                .reviewCount(toLong(r[15]))
                .totalStock(toInt(r[16]))
                .build()
        ).toList();
    }

    private List<CategoryDto> mapCategories(List<Object[]> rows) {
        return rows.stream().map(r -> CategoryDto.builder()
                .id(toLong(r[0]))
                .name(str(r[1]))
                .slug(str(r[2]))
                .sortOrder(toInt(r[3]))
                .productCount(toLong(r[4]))
                .build()
        ).toList();
    }

    private List<BrandDto> mapBrands(List<Object[]> rows) {
        return rows.stream().map(r -> BrandDto.builder()
                .id(toLong(r[0]))
                .name(str(r[1]))
                .slug(str(r[2]))
                .logoUrl(str(r[3]))
                .productCount(toLong(r[4]))
                .build()
        ).toList();
    }

    // ─── Type helpers ─────────────────────────────────────────────────────────

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }

    private static Long toLong(Object o) {
        if (o == null) return null;
        if (o instanceof Long l) return l;
        if (o instanceof Number n) return n.longValue();
        return Long.parseLong(o.toString());
    }

    private static Integer toInt(Object o) {
        if (o == null) return 0;
        if (o instanceof Integer i) return i;
        if (o instanceof Number n) return n.intValue();
        return Integer.parseInt(o.toString());
    }

    private static Double toDouble(Object o) {
        if (o == null) return 0.0;
        if (o instanceof Double d) return d;
        if (o instanceof Number n) return n.doubleValue();
        return Double.parseDouble(o.toString());
    }

    private static BigDecimal toBigDecimal(Object o) {
        if (o == null) return null;
        if (o instanceof BigDecimal bd) return bd;
        if (o instanceof Number n) return BigDecimal.valueOf(n.longValue());
        return new BigDecimal(o.toString());
    }
}
