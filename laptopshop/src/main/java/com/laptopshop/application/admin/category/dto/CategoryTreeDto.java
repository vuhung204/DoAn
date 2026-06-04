package com.laptopshop.application.admin.category.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.List;

@Getter @AllArgsConstructor
public class CategoryTreeDto {
    private Long                  id;
    private String                name;
    private String                slug;
    private Boolean               visible;
    private Integer               productCount;
    private List<CategoryTreeDto> children;
}
