package com.laptopshop.interfaces.rest.admin;

import com.laptopshop.application.admin.dashboard.dto.PageDto;
import com.laptopshop.application.admin.product.dto.*;
import com.laptopshop.application.admin.product.service.AdminProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final AdminProductService productService;

    @GetMapping("/filters/meta")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<ProductFiltersMetaDto> getFiltersMeta() {
        return ResponseEntity.ok(productService.getFiltersMeta());
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<byte[]> exportProducts(
            @RequestParam(defaultValue = "LIST") String type,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "all") String status
    ) {
        ProductExportRequestDto req = new ProductExportRequestDto();
        req.setType(type); req.setQ(q);
        req.setBrandId(brandId); req.setCategoryId(categoryId);
        req.setStatus(status);

        byte[] bytes   = productService.exportProducts(req);
        String filename = "products-" + type.toLowerCase()
                + "-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(bytes.length);
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<PageDto<ProductListDto>> searchProducts(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortField = switch (sort.toLowerCase()) {
            case "name"      -> "name";
            case "baseprice",
                 "price"     -> "basePrice";
            case "saleprice" -> "salePrice";
            default          -> "id";
        };
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortField));
        return ResponseEntity.ok(productService.searchProducts(q, brandId, categoryId, status, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<ProductDetailDto> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProduct(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<ProductDetailDto> createProduct(
            @Valid @RequestBody CreateProductRequestDto dto
    ) {
        return ResponseEntity.status(201).body(productService.createProduct(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<ProductDetailDto> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductRequestDto dto
    ) {
        return ResponseEntity.ok(productService.updateProduct(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/visibility")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<Void> setVisibility(
            @PathVariable Long id,
            @Valid @RequestBody ProductVisibilityRequestDto dto
    ) {
        productService.setVisibility(id, Boolean.TRUE.equals(dto.getVisible()));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<Void> updateStock(
            @PathVariable Long id,
            @RequestParam(required = false) Integer stock,
            @RequestParam(required = false) Integer minStock
    ) {
        productService.updateStock(id, stock, minStock);
        return ResponseEntity.ok().build();
    }
}
