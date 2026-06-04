package com.laptopshop.interfaces.rest.admin;

import com.laptopshop.application.admin.auth.dto.AdminLoginRequest;
import com.laptopshop.application.admin.auth.dto.AdminLoginResponse;
import com.laptopshop.application.admin.auth.service.AdminAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    /**
     * POST /api/admin/auth/login
     * Body: { "email": "...", "password": "..." }
     * Response: { "accessToken": "...", "staff": { ... } }
     */
    @PostMapping("/login")
    public ResponseEntity<AdminLoginResponse> login(@Valid @RequestBody AdminLoginRequest request) {
        return ResponseEntity.ok(adminAuthService.login(request));
    }

    /**
     * POST /api/admin/auth/logout
     * JWT stateless — chỉ cần FE xóa token.
     * Endpoint này để FE có chỗ gọi nếu cần (audit log sau này).
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }
}
