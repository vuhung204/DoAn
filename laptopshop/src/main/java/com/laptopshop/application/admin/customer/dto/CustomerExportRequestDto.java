package com.laptopshop.application.admin.customer.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Params cho GET /admin/customers/export.
 * Map từ query params.
 */
@Getter
@Setter
@NoArgsConstructor
public class CustomerExportRequestDto {
    /** SUMMARY | LIST | DETAILS */
    private String type = "LIST";
    private String search;
    private String status;
    private String customerType;
    private Long storeId;
    private int page = 0;
    private int size = 1000;
}
