package com.laptopshop.application.admin.auth.service;

import com.laptopshop.application.admin.auth.dto.AdminLoginRequest;
import com.laptopshop.application.admin.auth.dto.AdminLoginResponse;
import com.laptopshop.domain.store.entity.Staff;
import com.laptopshop.domain.store.repository.StaffRepository;
import com.laptopshop.infrastructure.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminAuthService {

    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils        jwtUtils;

    public AdminLoginResponse login(AdminLoginRequest request) {

        // 1. Tìm staff theo email
        Staff staff = staffRepository.findByEmailWithRoleAndStore(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng"));

        // 2. Kiểm tra tài khoản active
        if (!staff.getIsActive()) {
            throw new ResponseStatusException(
                    HttpStatus.LOCKED, "Tài khoản đã bị khóa");
        }

        // 3. Kiểm tra password
        if (!passwordEncoder.matches(request.getPassword(), staff.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng");
        }

        // 4. Build roles string cho JWT
        //    JwtAuthFilter expect: "ROLE_SUPER_ADMIN" hoặc "ROLE_STORE_MANAGER" ...
        //    Role.name trong DB lưu dạng SUPER_ADMIN → thêm prefix ROLE_
        String roleName = staff.getRole().getName();
        // Uppercase để khớp hasAnyRole("SUPER_ADMIN") trong SecurityConfig
        // DB lưu lowercase "super_admin" → JWT cần "ROLE_SUPER_ADMIN"
        String roleUpper = roleName.toUpperCase();
        String roles = roleUpper.startsWith("ROLE_") ? roleUpper : "ROLE_" + roleUpper;

        // Thêm permissions từ role nếu có (JSON array trong Role.permissions)
        // Ví dụ permissions = ["orders","inventory"] → thêm vào authorities
        String permissions = buildPermissions(staff);
        if (!permissions.isEmpty()) {
            roles = roles + "," + permissions;
        }

        // 5. Tạo JWT
        String token = jwtUtils.generateToken(staff.getEmail(), roles);

        // 6. Build response
        return AdminLoginResponse.builder()
                .accessToken(token)
                .staff(AdminLoginResponse.StaffInfo.builder()
                        .id(staff.getId())
                        .fullName(staff.getFullName())
                        .email(staff.getEmail())
                        .phone(staff.getPhone())
                        .role(roleName)
                        .storeId(staff.getStore().getId())
                        .storeName(staff.getStore().getName())
                        .build())
                .build();
    }

    /**
     * Parse Role.permissions (JSON array string) thành comma-separated authorities.
     * Ví dụ: '["orders","inventory"]' → "orders,inventory"
     */
    private String buildPermissions(Staff staff) {
        String perms = staff.getRole().getPermissions();
        if (perms == null || perms.isBlank()) return "";

        // Đơn giản: bỏ dấu [], " và split
        return perms
                .replaceAll("[\\[\\]\"\\s]", "")
                .trim();
    }
}
