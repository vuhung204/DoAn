package com.laptopshop.application.admin.product.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

/**
 * Request body cho PUT /admin/products/{id}.
 * Tất cả fields optional — chỉ update field không null.
 * SKU không cho phép thay đổi sau khi tạo (validate ở service nếu cần).
 */
@Getter
@Setter
@NoArgsConstructor
public class UpdateProductRequestDto {

    @Size(max = 255)
    private String name;

    private Long brandId;
    private Long categoryId;
    private String description;

    @DecimalMin(value = "0", inclusive = false)
    private BigDecimal basePrice;

    @DecimalMin(value = "0", inclusive = false)
    private BigDecimal salePrice;

    @Min(0)
    private Integer stock;

    @Min(0)
    private Integer minStock;

    @Valid
    private ProductSpecsDto specs;

    /** Nếu không null → thay thế toàn bộ danh sách ảnh */
    private List<String> imageUrls;

    private Boolean visible;
}
