package com.laptopshop.application.admin.setting.dto;

import lombok.Getter;

@Getter
public class StoreUpdateRequestDto {
    private String name;
    private String address;
    private String district;
    private String city;
    private String phone;
    private String email;
    private String status;
}