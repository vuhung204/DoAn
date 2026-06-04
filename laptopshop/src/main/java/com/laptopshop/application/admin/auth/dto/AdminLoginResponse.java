package com.laptopshop.application.admin.auth.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminLoginResponse {

    private String accessToken;

    /** Thông tin staff trả về FE để hiển thị tên, role */
    private StaffInfo staff;

    @Getter
    @Builder
    public static class StaffInfo {
        private Long   id;
        private String fullName;
        private String email;
        private String phone;
        private String role;        // tên role, ví dụ: SUPER_ADMIN
        private Long   storeId;
        private String storeName;
    }
}
