package com.laptopshop.application.admin.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.List;

@Getter @AllArgsConstructor
public class ExportTicketDto {
    private Long       ticketId;
    private Long       branchId;
    private String     branchName;
    private String     reason;
    private List<InventoryTicketLineDto> lines;
    private String     status;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
    private Long       createdBy;
}
