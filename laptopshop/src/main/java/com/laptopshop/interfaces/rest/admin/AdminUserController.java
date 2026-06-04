package com.laptopshop.interfaces.rest.admin;

import com.laptopshop.domain.user.entity.User;
import com.laptopshop.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
public class AdminUserController {

    private final UserRepository userRepository;

    /**
     * GET /api/admin/users/search?q=...
     *
     * Tìm user theo:
     *   - Số điện thoại (phone)
     *   - Email
     *   - Tên (fullName)
     *
     * Query phải >= 2 ký tự, trả về tối đa 10 kết quả
     */
    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResponse>> searchUsers(
            @RequestParam(name = "q", required = false, defaultValue = "") String query) {

        // Trim và kiểm tra độ dài
        String searchQuery = query.trim();
        if (searchQuery.length() < 2) {
            return ResponseEntity.ok(List.of());
        }

        // Tìm user theo phone, email hoặc fullName (case-insensitive)
        List<User> users = userRepository.findAll()
                .stream()
                .filter(u -> {
                    String phone = (u.getPhone() != null) ? u.getPhone().toLowerCase() : "";
                    String email = (u.getEmail() != null) ? u.getEmail().toLowerCase() : "";
                    String name = (u.getFullName() != null) ? u.getFullName().toLowerCase() : "";
                    String q = searchQuery.toLowerCase();

                    return phone.contains(q) || email.contains(q) || name.contains(q);
                })
                .limit(10)
                .collect(Collectors.toList());

        List<UserSearchResponse> results = users.stream()
                .map(UserSearchResponse::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    @Getter
    @Setter
    public static class UserSearchResponse {
        private Long userId;
        private String fullName;
        private String email;
        private String phone;
        private String avatarUrl;

        public static UserSearchResponse from(User user) {
            UserSearchResponse response = new UserSearchResponse();
            response.userId = user.getId();
            response.fullName = user.getFullName() != null ? user.getFullName() : "Không có tên";
            response.email = user.getEmail();
            response.phone = user.getPhone();
            response.avatarUrl = user.getAvatarUrl();
            return response;
        }
    }
}
