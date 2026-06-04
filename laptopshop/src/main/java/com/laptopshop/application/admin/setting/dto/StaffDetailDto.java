package com.laptopshop.application.admin.setting.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.List;

@Getter @AllArgsConstructor
public class StaffDetailDto {
    private Long          id;
    private String        fullName;
    private String        email;
    private String        phone;
    private Long          storeId;
    private String        branchName;
    private Long          roleId;
    private String        roleName;
    /** Danh sách permissions từ roles.permissions JSON */
    private List<String>  permissions;
    private String        status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
