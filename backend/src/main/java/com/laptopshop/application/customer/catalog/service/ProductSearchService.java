package com.laptopshop.application.customer.catalog.service;

import com.laptopshop.application.customer.catalog.dto.ProductSearchPageResponse;
import com.laptopshop.application.customer.catalog.dto.ProductSearchRequest;
import com.laptopshop.application.customer.catalog.dto.ProductSearchResponse;
import com.laptopshop.domain.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductSearchService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public ProductSearchPageResponse search(ProductSearchRequest req) {

        Pageable pageable = PageRequest.of(
                req.getPage(),
                req.getSize(),
                buildSort(req.getSort())
        );

        // Chuẩn hoá input: empty list → null để JPQL bypass filter
        List<Long>   brandIds = isEmpty(req.getBrandIds()) ? null : req.getBrandIds();
        List<String> rams     = isEmpty(req.getRams())     ? null : req.getRams();
        String       keyword  = isBlank(req.getQ())        ? null : req.getQ().trim();

        Page<com.laptopshop.domain.catalog.entity.Product> page =
                productRepository.searchForCustomer(
                        keyword,
                        brandIds,
                        req.getCategoryId(),
                        req.getMinPrice(),
                        req.getMaxPrice(),
                        rams,
                        pageable
                );

        // Enrich rating từ bảng reviews (1 query cho cả page, không N+1)
        List<Long> productIds = page.getContent().stream()
                .map(com.laptopshop.domain.catalog.entity.Product::getId)
                .toList();

        Map<Long, Object[]> ratingMap = productIds.isEmpty()
                ? Map.of()
                : productRepository.findRatingStatsByProductIds(productIds)
                .stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> row));

        List<ProductSearchResponse> products = page.getContent().stream()
                .map(p -> {
                    ProductSearchResponse base = ProductSearchResponse.from(p);
                    Object[] stats = ratingMap.get(p.getId());
                    return stats != null
                            ? base.withRating((Double) stats[1], (Long) stats[2])
                            : base;
                })
                .toList();

        // Tập RAM có sẵn để render sidebar filter (toàn bộ DB, không bị ảnh hưởng bởi filter hiện tại)
        List<String> availableRams = productRepository.findDistinctRams();

        return ProductSearchPageResponse.builder()
                .products(products)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .availableRams(availableRams)
                .build();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Sort buildSort(String sort) {
        if (sort == null) return Sort.unsorted();
        return switch (sort) {
            case "price_asc"  -> Sort.by("salePrice").ascending().and(Sort.by("basePrice").ascending());
            case "price_desc" -> Sort.by("salePrice").descending().and(Sort.by("basePrice").descending());
            case "name"       -> Sort.by("name").ascending();
            // "popular" và "rating" cần thêm join aggregation — fallback về unsorted
            default           -> Sort.unsorted();
        };
    }

    private static boolean isEmpty(List<?> list) {
        return list == null || list.isEmpty();
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
