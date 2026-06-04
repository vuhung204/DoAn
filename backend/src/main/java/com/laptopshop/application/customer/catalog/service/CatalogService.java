package com.laptopshop.application.customer.catalog.service;

import com.laptopshop.application.customer.catalog.dto.BrandResponse;
import com.laptopshop.application.customer.catalog.dto.CategoryResponse;
import com.laptopshop.application.customer.catalog.dto.ProductDetailResponse;
import com.laptopshop.application.customer.catalog.dto.ProductResponse;
import com.laptopshop.domain.catalog.entity.Category;
import com.laptopshop.domain.catalog.entity.Product;
import com.laptopshop.domain.catalog.repository.BrandRepository;
import com.laptopshop.domain.catalog.repository.CategoryRepository;
import com.laptopshop.domain.catalog.repository.ProductRepository;
import jakarta.persistence.Cacheable;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CatalogService {
    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;

    public Page<ProductResponse> getProducts(Long brandId, Long categoryId,
                                             BigDecimal minPrice, BigDecimal maxPrice,
                                             String keyword, int page, int size, String sortBy) {

        Sort sort = switch (sortBy) {
            case "price_asc"  -> Sort.by("salePrice").ascending();
            case "price_desc" -> Sort.by("salePrice").descending();
            case "newest"     -> Sort.by("createdAt").descending();
            default           -> Sort.by("id").descending();
        };

        Pageable pageable = PageRequest.of(page, size, sort);
        return productRepository.findWithFilters(
                        brandId, categoryId, minPrice, maxPrice, keyword, pageable)
                .map(ProductResponse::from);
    }

    public ProductDetailResponse getProductDetail(Long id) {
        Product product = productRepository.findByIdWithImages(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        productRepository.findByIdWithInventories(id)
                .ifPresent(p -> product.setInventories(p.getInventories()));

        productRepository.findByIdWithReviews(id)
                .ifPresent(p -> product.setReviews(p.getReviews()));

        return ProductDetailResponse.from(product);
    }

    public List<BrandResponse> getBrands() {
        return brandRepository.findAllByIsActiveTrueOrderByName()
                .stream().map(BrandResponse::from).collect(Collectors.toList());
    }

//    public List<CategoryResponse> getCategories() {
//        return categoryRepository.findAllByIsActiveTrueAndParentIsNullOrderBySortOrder()
//                .stream()
//                .map(c -> CategoryResponse.from(c))
//                .collect(Collectors.toList());
//    }

    /**
     * Trả về danh sách category dạng cây:
     * - Root nodes (parentId == null) ở ngoài cùng
     * - Children lồng trong root.children
     * - Chỉ 2 cấp (root → child); deep nesting không cần cho menu
     *
     * Cache 10 phút — categories thay đổi rất ít.
     */
    /**
     * Trả về danh sách category dạng cây 2 cấp:
     *   root → children
     *
     * Thuật toán O(n):
     *   1. Fetch tất cả category active, đã sắp xếp theo sortOrder
     *   2. Tạo map id → DTO
     *   3. Duyệt 1 lần: node có parent → gắn vào DTO cha qua addChild()
     *   4. Trả về danh sách root (parentId == null)
     */
    public List<CategoryResponse> getCategories() {
        List<Category> all = categoryRepository.findAllActiveOrdered();

        // Bước 1: id → DTO map (LinkedHashMap giữ thứ tự sortOrder)
        Map<Long, CategoryResponse> dtoMap = new LinkedHashMap<>();
        for (Category c : all) {
            dtoMap.put(c.getId(), CategoryResponse.from(c));
        }

        // Bước 2: build tree
        List<CategoryResponse> roots = new ArrayList<>();
        for (Category c : all) {
            CategoryResponse dto = dtoMap.get(c.getId());
            if (c.getParent() == null) {
                roots.add(dto);
            } else {
                CategoryResponse parentDto = dtoMap.get(c.getParent().getId());
                if (parentDto != null) {
                    parentDto.addChild(dto);
                }
            }
        }

        return roots;
    }
}
