package com.laptopshop.interfaces.rest.user;

import com.laptopshop.application.customer.catalog.dto.*;
import com.laptopshop.application.customer.catalog.service.CatalogService;
import com.laptopshop.application.customer.catalog.service.ProductSearchService;
import com.laptopshop.domain.catalog.repository.BrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class CatalogController {
    private final CatalogService catalogService;
    private final ProductSearchService searchService;
    private final BrandRepository brandRepository;

    // GET /api/products?brandId=&categoryId=&minPrice=&maxPrice=&keyword=&page=0&size=12&sort=newest
    @GetMapping("/api/products")
    public ResponseEntity<Page<ProductResponse>> getProducts(
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "newest") String sort) {

        return ResponseEntity.ok(catalogService.getProducts(
                brandId, categoryId, minPrice, maxPrice, keyword, page, size, sort));
    }

    // GET /api/products/{id}
    @GetMapping("/api/products/{id}")
    public ResponseEntity<ProductDetailResponse> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(catalogService.getProductDetail(id));
    }

    // GET /api/brands
//    @GetMapping("/api/brands")
//    public ResponseEntity<List<BrandResponse>> getBrands() {
//        return ResponseEntity.ok(catalogService.getBrands());
//    }

    // GET /api/categories
    @GetMapping("/api/categories")
    public ResponseEntity<List<CategoryResponse>> getCategories() {
        return ResponseEntity.ok(catalogService.getCategories());
    }

    /**
     * Tìm kiếm sản phẩm.
     *
     * Query params:
     *   q          – từ khoá (optional)
     *   brandIds   – 1,3,5  (optional, comma-separated → Spring bind List<Long>)
     *   categoryId – (optional)
     *   minPrice   – (optional)
     *   maxPrice   – (optional)
     *   rams       – 8GB,16GB (optional)
     *   page       – 0-based, default 0
     *   size       – default 12
     *   sort       – popular | price_asc | price_desc | name
     *
     * Response: ProductSearchPageResponse
     */
    @GetMapping("/api/products/search")
    public ResponseEntity<ProductSearchPageResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) List<Long> brandIds,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) List<String> rams,
            @RequestParam(defaultValue = "0")        int page,
            @RequestParam(defaultValue = "12")       int size,
            @RequestParam(defaultValue = "popular")  String sort) {

        // Giới hạn page size để tránh abuse
        int safeSize = Math.min(size, 48);

        ProductSearchRequest req = new ProductSearchRequest();
        req.setQ(q);
        req.setBrandIds(brandIds);
        req.setCategoryId(categoryId);
        req.setMinPrice(minPrice);
        req.setMaxPrice(maxPrice);
        req.setRams(rams);
        req.setPage(page);
        req.setSize(safeSize);
        req.setSort(sort);

        return ResponseEntity.ok(searchService.search(req));
    }

    /**
     * Danh sách brand active — dùng để render sidebar filter.
     *
     * Response: [ { "id": 1, "name": "Dell", "slug": "dell", "logoUrl": "..." }, ... ]
     */
    @GetMapping("/api/brands")
    public ResponseEntity<List<Map<String, Object>>> getBrands() {
        List<Map<String, Object>> brands = brandRepository.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(b -> Map.<String, Object>of(
                        "id",      b.getId(),
                        "name",    b.getName(),
                        "slug",    b.getSlug() != null ? b.getSlug() : "",
                        "logoUrl", b.getLogoUrl() != null ? b.getLogoUrl() : ""
                ))
                .toList();
        return ResponseEntity.ok(brands);
    }
}
