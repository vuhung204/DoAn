package com.laptopshop.application.admin.category.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import java.util.List;

@Getter
public class ReorderCategoryRequestDto {
    /** null = reorder root categories */
    private Long        parentId;
    @NotNull
    private List<Long>  orderedCategoryIds;
}
