package com.laptopshop.application.customer.notification.dto;

import com.laptopshop.domain.notification.entity.Notification;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
public class NotificationPageResponse {

    private final List<NotificationDto> content;
    private final long   totalElements;
    private final int    totalPages;
    private final int    currentPage;
    private final long   unreadCount;

    private NotificationPageResponse(Page<Notification> page, long unread) {
        this.content       = page.getContent().stream().map(NotificationDto::from).toList();
        this.totalElements = page.getTotalElements();
        this.totalPages    = page.getTotalPages();
        this.currentPage   = page.getNumber();
        this.unreadCount   = unread;
    }

    public static NotificationPageResponse of(Page<Notification> page, long unread) {
        return new NotificationPageResponse(page, unread);
    }
}