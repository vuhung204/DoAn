package com.laptopshop.application.admin.setting.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter @AllArgsConstructor
public class StoreListDto {
    private Long    id;
    private String  name;
    private String  address;
    private String  phone;
    private String  city;
    /** active | inactive */
    private String  status;
}
