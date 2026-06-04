package com.laptopshop.application.admin.promotion.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class ExportPromotionsRequestDto {
    private String        q;
    private String        status;
    private String        type;
    private LocalDateTime fromDate;
    private LocalDateTime toDate;
    private String        format = "XLSX";
}
