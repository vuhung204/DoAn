package com.laptopshop.application.customer.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchSuggestionResponse {

    private Long id;
    private String name;
    private String slug;
    private String brandName;
    private String categoryName;

    /** Giá hiển thị: salePrice nếu có, fallback basePrice */
    private BigDecimal price;

    /** URL ảnh primary */
    private String imageUrl;
}
