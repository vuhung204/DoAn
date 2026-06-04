package com.laptopshop.application.customer.catalog.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

/**
 * Query params cho GET /api/products/search
 *
 * Ví dụ:
 *   /api/products/search?q=gaming&brandIds=1,3&minPrice=10000000&maxPrice=30000000
 *                       &rams=8GB,16GB&page=0&size=12&sort=price_asc
 */
@Getter
@Setter
public class ProductSearchRequest {

    /** Từ khoá tìm kiếm (tên sản phẩm). */
    private String q;

    /** Lọc theo một hoặc nhiều brand. */
    private List<Long> brandIds;

    /** Lọc theo category. */
    private Long categoryId;

    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    /**
     * Lọc theo RAM — so khớp với product_specs.ram.
     * Ví dụ: ["8GB", "16GB"]
     */
    private List<String> rams;

    /** 0-based page index. */
    private int page = 0;

    /** Items per page. */
    private int size = 12;

    /**
     * Sắp xếp: popular | price_asc | price_desc | rating | name
     * Mặc định: popular (thứ tự DB, không sort thêm).
     */
    private String sort = "popular";
}
