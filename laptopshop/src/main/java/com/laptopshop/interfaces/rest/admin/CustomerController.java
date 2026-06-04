package com.laptopshop.interfaces.rest.admin;

import com.laptopshop.application.admin.customer.dto.*;
import com.laptopshop.application.admin.customer.service.AdminCustomerService;
import com.laptopshop.application.admin.dashboard.dto.PageDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/admin/customers")  // FIX: thêm /api prefix
@RequiredArgsConstructor
public class CustomerController {

    private final AdminCustomerService adminCustomerService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<CustomerStatsSummaryDto> getSummary(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long storeId
    ) {
        return ResponseEntity.ok(adminCustomerService.getStats(period, endDate, storeId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<PageDto<CustomerListDto>> getCustomers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "joined") String sort,
            @RequestParam(required = false) Long storeId
    ) {
        Sort sortSpec = "totalSpent".equalsIgnoreCase(sort)
                ? Sort.by(Sort.Direction.DESC, "totalSpent")
                : Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sortSpec);
        return ResponseEntity.ok(
                adminCustomerService.searchCustomers(search, status, type, pageable, storeId)
        );
    }

    @GetMapping("/top")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<List<TopCustomerDto>> getTopCustomers(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam(required = false) Long storeId
    ) {
        return ResponseEntity.ok(adminCustomerService.getTopCustomers(startDate, endDate, limit, storeId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<CustomerDetailDto> getCustomerDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminCustomerService.getCustomerDetail(id));
    }

    @GetMapping("/{id}/orders")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF')")
    public ResponseEntity<PageDto<OrderSummaryDto>> getCustomerOrders(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(adminCustomerService.getCustomerOrders(id, PageRequest.of(page, size)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<Void> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomerStatusRequestDto req
    ) {
        adminCustomerService.updateCustomerStatus(id, req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<ResetPasswordResponseDto> resetPassword(@PathVariable Long id) {
        return ResponseEntity.ok(adminCustomerService.resetPassword(id));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<byte[]> exportCustomers(
            @RequestParam(defaultValue = "LIST") String type,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String customerType,
            @RequestParam(required = false) Long storeId,
            @RequestParam(defaultValue = "0")    int page,
            @RequestParam(defaultValue = "1000") int size
    ) {
        CustomerExportRequestDto req = new CustomerExportRequestDto();
        req.setType(type);
        req.setSearch(search);
        req.setStatus(status);
        req.setCustomerType(customerType);
        req.setStoreId(storeId);
        req.setPage(page);
        req.setSize(size);

        byte[] bytes   = adminCustomerService.exportCustomers(req);
        String filename = "customers-" + type.toLowerCase()
                + "-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(bytes.length);
        return ResponseEntity.ok().headers(headers).body(bytes);
    }
}
