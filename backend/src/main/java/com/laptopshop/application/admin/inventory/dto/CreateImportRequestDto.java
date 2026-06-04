package com.laptopshop.application.admin.inventory.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import java.util.List;

@Getter
public class CreateImportRequestDto {
    @NotNull  private Long   branchId;
    @NotEmpty private List<InventoryTicketLineDto> lines;
    private String supplier;
    private String note;
    private Long   createdBy;
}
