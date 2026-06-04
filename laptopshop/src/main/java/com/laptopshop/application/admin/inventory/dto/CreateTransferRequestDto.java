package com.laptopshop.application.admin.inventory.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import java.util.List;

@Getter
public class CreateTransferRequestDto {
    @NotNull  private Long   fromBranchId;
    @NotNull  private Long   toBranchId;
    @NotEmpty private List<InventoryTicketLineDto> lines;
    private String reason;
    private String note;
    private Long   createdBy;
}
