package com.laptopshop.application.customer.catalog.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * Response của GET /api/products/search — bao gồm:
 *   - Danh sách sản phẩm trang hiện tại
 *   - Thông tin phân trang
 *   - Các giá trị filter có sẵn (để FE render sidebar động)
 */
@Getter
@Builder
public class ProductSearchPageResponse {

    private List<ProductSearchResponse> products;

    // ── Pagination ────────────────────────────────────────────────────────────
    private int  page;
    private int  size;
    private long totalElements;
    private int  totalPages;

    // ── Filter options (sidebar) ──────────────────────────────────────────────
    /** Danh sách RAM duy nhất có trong kết quả tìm kiếm hiện tại */
    private List<String> availableRams;
}
