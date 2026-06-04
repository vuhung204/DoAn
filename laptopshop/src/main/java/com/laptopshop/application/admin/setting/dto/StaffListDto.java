package com.laptopshop.application.admin.setting.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter @AllArgsConstructor
public class StaffListDto {
    private Long   id;
    private String fullName;
    private String email;
    private String phone;
    private String branchName;
    private String roleName;
    /** active | inactive */
    private String status;
}
