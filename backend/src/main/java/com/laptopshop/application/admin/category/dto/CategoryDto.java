package com.laptopshop.application.admin.category.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter @AllArgsConstructor
public class CategoryDto {
    private Long          id;
    private String        name;
    private String        slug;
    private Long          parentId;
    private Integer       sortOrder;
    private Boolean       visible;
    private Integer       productCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
