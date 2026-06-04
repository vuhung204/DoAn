package com.laptopshop.application.admin.product.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

/**
 * Request body cho POST /admin/products.
 * Server nhận giá VND dạng BigDecimal (không cần K conversion — frontend đã xử lý).
 */
@Getter
@Setter
@NoArgsConstructor
public class CreateProductRequestDto {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255)
    private String name;

    @NotBlank(message = "SKU không được để trống")
    @Size(max = 100)
    private String sku;

    @NotNull(message = "Brand không được để trống")
    private Long brandId;

    @NotNull(message = "Category không được để trống")
    private Long categoryId;

    private String description;

    @NotNull(message = "Giá gốc không được để trống")
    @DecimalMin(value = "0", inclusive = false, message = "Giá gốc phải > 0")
    private BigDecimal basePrice;

    /** null = không có giá khuyến mãi */
    @DecimalMin(value = "0", inclusive = false, message = "Giá KM phải > 0")
    private BigDecimal salePrice;

    /** Tồn kho ban đầu (áp vào 1 chi nhánh mặc định hoặc global) */
    @NotNull @Min(0)
    private Integer stock = 0;

    @NotNull @Min(0)
    private Integer minStock = 5;

    @Valid
    private ProductSpecsDto specs;

    /** Danh sách URL ảnh — ảnh đầu tiên là primary */
    private List<String> imageUrls;

    @NotNull
    private Boolean visible = true;
}
