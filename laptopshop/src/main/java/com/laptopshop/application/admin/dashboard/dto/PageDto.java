package com.laptopshop.application.admin.dashboard.dto;

import lombok.Getter;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Generic pagination wrapper dùng thay Spring Page<T> ở service boundary.
 */
@Getter
@AllArgsConstructor
public class PageDto<T> {
    private List<T> content;
    private long totalElements;
    private int totalPages;
    private int pageNumber;
    private int pageSize;

    public static <T> PageDto<T> from(Page<T> page) {
        return new PageDto<>(
                page.getContent(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize()
        );
    }
}
