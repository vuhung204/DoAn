package com.laptopshop.application.admin.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.List;

@Getter @AllArgsConstructor
public class TransferTicketDto {
    private Long       ticketId;
    private Long       fromBranchId;
    private String     fromBranchName;
    private Long       toBranchId;
    private String     toBranchName;
    private String     reason;
    private List<InventoryTicketLineDto> lines;
    private String     status;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
    private Long       createdBy;
}
