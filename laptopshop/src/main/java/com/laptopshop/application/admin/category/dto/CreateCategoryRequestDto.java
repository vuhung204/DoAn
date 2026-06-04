package com.laptopshop.application.admin.category.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class CreateCategoryRequestDto {
    @NotBlank(message = "Tên danh mục không được để trống")
    private String  name;
    /** Nếu null → tự sinh từ name */
    private String  slug;
    private Long    parentId;
    private Integer sortOrder;
    private Boolean visible = true;
}
