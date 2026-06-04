package com.laptopshop.application.admin.setting.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @AllArgsConstructor
public class StoreDetailDto {
    private Long       id;
    private String     name;
    private String     address;
    private String     district;
    private String     city;
    private String     phone;
    private String     email;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String     status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int        staffCount;
}