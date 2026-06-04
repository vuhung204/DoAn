package com.laptopshop.interfaces.rest.admin;

import com.laptopshop.application.admin.refund.dto.PageDto;
import com.laptopshop.application.admin.setting.dto.*;
import com.laptopshop.application.admin.setting.service.StoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Base URL: /api/admin/stores   ← FIX: thêm /api prefix
 */
@RestController
@RequestMapping("/api/admin/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    private static final String ROLES_READ  = "hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')";
    private static final String ROLES_WRITE = "hasAnyRole('SUPER_ADMIN','STORE_MANAGER')";

    // Đặt TRƯỚC /{id}
    @GetMapping("/export")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<byte[]> export(@RequestParam(required = false) String status) {
        byte[] data = storeService.exportStores(status);
        String filename = "stores-"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"))
                + ".xlsx";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        return ResponseEntity.ok().headers(headers).body(data);
    }

    @GetMapping
    @PreAuthorize(ROLES_READ)
    public ResponseEntity<PageDto<StoreListDto>> search(
            @RequestParam(required = false)      String q,
            @RequestParam(required = false)      String status,
            @RequestParam(defaultValue = "0")    int    page,
            @RequestParam(defaultValue = "20")   int    size,
            @RequestParam(defaultValue = "name") String sort,
            @RequestParam(defaultValue = "asc")  String dir
    ) {
        Sort.Direction direction = "desc".equalsIgnoreCase(dir)
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by(direction, sort));
        return ResponseEntity.ok(storeService.searchStores(q, status, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize(ROLES_READ)
    public ResponseEntity<StoreDetailDto> getStore(@PathVariable Long id) {
        return ResponseEntity.ok(storeService.getStore(id));
    }

    @PostMapping
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<StoreDetailDto> createStore(
            @Valid @RequestBody StoreCreateRequestDto req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(storeService.createStore(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<StoreDetailDto> updateStore(
            @PathVariable Long id,
            @RequestBody StoreUpdateRequestDto req) {
        return ResponseEntity.ok(storeService.updateStore(id, req));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<Void> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateDto req) {
        storeService.changeStatus(id, req.getStatus());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(ROLES_WRITE)
    public ResponseEntity<Void> deleteStore(@PathVariable Long id) {
        storeService.deleteStore(id);
        return ResponseEntity.noContent().build();
    }
}
