package com.laptopshop.application.admin.category.dto;

import lombok.Getter;

@Getter
public class UpdateCategoryRequestDto {
    private String  name;
    private String  slug;
    private Long    parentId;
    private Integer sortOrder;
    private Boolean visible;
}