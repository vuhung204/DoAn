package com.laptopshop.application.admin.inventory.dto;

import lombok.Getter;
import org.springframework.data.domain.Page;
import java.util.List;

@Getter
public class PageDto<T> {
    private final List<T>  content;
    private final long     totalElements;
    private final int      totalPages;
    private final int      number;
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

    public static <T> PageDto<T> of(Page<T> page) {
        return new PageDto<>(page);
    }
}
