package com.laptopshop.interfaces.rest.admin;

import com.laptopshop.application.admin.brand.dto.*;
import com.laptopshop.application.admin.brand.service.AdminBrandService;
import com.laptopshop.application.admin.dashboard.dto.PageDto;
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
@RequestMapping("/api/admin/brands")  // FIX: thêm /api prefix
@RequiredArgsConstructor
public class BrandController {

    private final AdminBrandService adminBrandService;

    // PHẢI đặt trước /{id}
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<BrandStatsDto> getSummary() {
        return ResponseEntity.ok(adminBrandService.getStats());
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<byte[]> exportBrands(
            @RequestParam(defaultValue = "xlsx") String format,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean active
    ) {
        BrandExportRequestDto req = new BrandExportRequestDto();
        req.setFormat(format); req.setQ(q); req.setActive(active);

        byte[] bytes   = adminBrandService.exportBrands(req);
        boolean isCsv  = "csv".equalsIgnoreCase(format);
        String  ext    = isCsv ? "csv" : "xlsx";
        String  filename = "brands-"
                + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "." + ext;

        MediaType mediaType = isCsv
                ? MediaType.parseMediaType("text/csv; charset=UTF-8")
                : MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(bytes.length);
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<PageDto<BrandDto>> listBrands(
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "20")  int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "name") String sort,
            @RequestParam(defaultValue = "asc")  String direction
    ) {
        Sort.Direction dir = "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = switch (sort.toLowerCase()) {
            case "createdat", "created" -> "createdAt";
            default                     -> "name";
        };
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortField));
        return ResponseEntity.ok(adminBrandService.listBrands(q, active, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<BrandDto> getBrand(@PathVariable Long id) {
        return ResponseEntity.ok(adminBrandService.getBrand(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<BrandDto> createBrand(
            @Valid @RequestBody CreateBrandRequestDto dto
    ) {
        return ResponseEntity.status(201).body(adminBrandService.createBrand(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<BrandDto> updateBrand(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBrandRequestDto dto
    ) {
        return ResponseEntity.ok(adminBrandService.updateBrand(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<Void> deleteBrand(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean force
    ) {
        adminBrandService.deleteBrand(id, force);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<Void> setActive(
            @PathVariable Long id,
            @Valid @RequestBody BrandActiveRequestDto dto
    ) {
        adminBrandService.setActive(id, Boolean.TRUE.equals(dto.getActive()));
        return ResponseEntity.ok().build();
    }
}
