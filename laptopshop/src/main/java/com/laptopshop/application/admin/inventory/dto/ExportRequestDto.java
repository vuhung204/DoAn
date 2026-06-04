package com.laptopshop.application.admin.inventory.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ExportRequestDto {
    private String        exportType;   // PRODUCTS | IMPORTS | EXPORTS | TRANSFERS | ALERTS
    private String        q;
    private Long          storeId;
    private LocalDateTime fromDate;
    private LocalDateTime toDate;
}
