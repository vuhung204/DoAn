package com.laptopshop.application.admin.refund.dto;

import lombok.Getter;

@Getter
public class ProcessRefundRequestDto {
    private Long   processedById;
    private String note;
}