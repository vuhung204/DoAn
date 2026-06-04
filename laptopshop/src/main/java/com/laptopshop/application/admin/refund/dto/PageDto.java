package com.laptopshop.application.admin.refund.dto;

import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Generic wrapper cho Spring Data Page — dùng cho tất cả admin list response.
 * Static factory: PageDto.of(page)
 */
@Getter
public class PageDto<T> {

    private final List<T>  content;
    private final long     totalElements;
    private final int      totalPages;
    private final int      number;   // current page, 0-indexed
    private final int      size;
    private final boolean  first;
    private final boolean  last;

    private PageDto(Page<T> page) {
        this.content       = page.getContent();
        this.totalElements = page.getTotalElements();
        this.totalPages    = page.getTotalPages();
        this.number        = page.getNumber();
        this.size          = page.getSize();
        this.first         = page.isFirst();
        this.last          = page.isLast();
    }

    /** Dùng: PageDto.of(page.map(this::toListDto)) */
    public static <T> PageDto<T> of(Page<T> page) {
        return new PageDto<>(page);
    }
}
