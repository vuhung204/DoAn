package com.laptopshop.infrastructure.security;

import com.laptopshop.domain.store.entity.Staff;
import com.laptopshop.domain.store.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Kiểm tra staff có quyền thao tác trên một chi nhánh cụ thể không.
 *
 * Quy tắc:
 *   - SUPER_ADMIN  → được phép mọi chi nhánh
 *   - Các role khác → chỉ được thao tác trên chi nhánh mình thuộc về
 */
@Component
@RequiredArgsConstructor
public class StoreAccessGuard {

    private static final String ROLE_SUPER_ADMIN = "super_admin";

    private final StaffRepository staffRepository;

    // ── Kiểm tra theo staffId (dùng trong OrderService, InventoryService) ────

    /**
     * @param staffId       ID của staff đang thao tác (lấy từ JWT)
     * @param targetStoreId ID chi nhánh muốn thao tác
     * @throws ResponseStatusException 403 nếu không có quyền
     */
    public void assertCanAccessStore(Long staffId, Long targetStoreId) {
        if (staffId == null || targetStoreId == null) return;

        Staff staff = staffRepository.findWithRelationsById(staffId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Không tìm thấy thông tin staff"));

        assertAccess(staff, targetStoreId);
    }

    // ── Kiểm tra theo email (dùng trong WarrantyService) ─────────────────────

    /**
     * @param staffEmail    Email của staff đang thao tác (lấy từ JWT principal)
     * @param targetStoreId ID chi nhánh muốn thao tác
     * @throws ResponseStatusException 403 nếu không có quyền
     */
    public void assertCanAccessStore(String staffEmail, Long targetStoreId) {
        if (staffEmail == null || targetStoreId == null) return;

        Staff staff = staffRepository.findByEmailWithRoleAndStore(staffEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Không tìm thấy thông tin staff"));

        assertAccess(staff, targetStoreId);
    }

    // ── Load staff theo email (tái sử dụng ở WarrantyService) ────────────────

    /**
     * Load staff kèm role + store từ email.
     * Dùng để thay thế staffRepo.findByEmail() ở những nơi cần cả 3 quan hệ.
     */
    public Staff loadStaffByEmail(String email) {
        return staffRepository.findByEmailWithRoleAndStore(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Không tìm thấy thông tin staff"));
    }

    /**
     * Trả về storeId của staff (dùng để auto-scope filter cho STORE_MANAGER / SALES_STAFF).
     * SUPER_ADMIN trả về null (không giới hạn chi nhánh).
     */
    public Long resolveStoreScope(Long staffId) {
        if (staffId == null) return null;
        Staff staff = staffRepository.findWithRelationsById(staffId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Không tìm thấy thông tin staff"));
        return isSuperAdmin(staff) ? null : staff.getStore().getId();
    }

    public Long resolveStoreScope(String staffEmail) {
        if (staffEmail == null) return null;
        Staff staff = staffRepository.findByEmailWithRoleAndStore(staffEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Không tìm thấy thông tin staff"));
        return isSuperAdmin(staff) ? null : staff.getStore().getId();
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private void assertAccess(Staff staff, Long targetStoreId) {
        if (isSuperAdmin(staff)) return; // super_admin bypass

        Long staffStoreId = staff.getStore() != null ? staff.getStore().getId() : null;
        if (!targetStoreId.equals(staffStoreId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bạn không có quyền thao tác với chi nhánh này");
        }
    }

    private boolean isSuperAdmin(Staff staff) {
        return staff.getRole() != null
                && ROLE_SUPER_ADMIN.equalsIgnoreCase(staff.getRole().getName());
    }
}