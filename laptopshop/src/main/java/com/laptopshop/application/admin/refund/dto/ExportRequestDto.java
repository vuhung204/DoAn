package com.laptopshop.application.admin.refund.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class ExportRequestDto {
    /** LIST | DETAIL | REFUNDS */
    private String exportType = "LIST";
    private String        q;
    private String        status;
    private Long          storeId;
    private LocalDateTime fromDate;
    private LocalDateTime toDate;
}
