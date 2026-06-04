package com.laptopshop.application.admin.setting.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.laptopshop.application.admin.refund.dto.PageDto;
import com.laptopshop.application.admin.setting.dto.StaffCreateRequestDto;
import com.laptopshop.application.admin.setting.dto.StaffDetailDto;
import com.laptopshop.application.admin.setting.dto.StaffListDto;
import com.laptopshop.application.admin.setting.dto.StaffUpdateRequestDto;
import com.laptopshop.domain.store.entity.Role;
import com.laptopshop.domain.store.entity.Staff;
import com.laptopshop.domain.store.entity.Store;
import com.laptopshop.domain.store.repository.RoleRepository;
import com.laptopshop.domain.store.repository.StaffRepository;
import com.laptopshop.domain.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffServiceImpl implements StaffService {

    private final StaffRepository  staffRepo;
    private final StoreRepository  storeRepo;
    private final RoleRepository   roleRepo;
    private final PasswordEncoder  passwordEncoder;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public PageDto<StaffListDto> searchStaff(String q, Long storeId, String role,
                                             String status, Pageable pageable) {
        Page<Staff> page = staffRepo.searchStaff(
                blankToNull(q), storeId, blankToNull(role), parseActive(status), pageable);
        return PageDto.of(page.map(this::toListDto));
    }

    @Override
    @Transactional(readOnly = true)
    public StaffDetailDto getStaff(Long id) {
        Staff st = staffRepo.findWithRelationsById(id).orElseThrow(() -> notFound(id));
        return toDetailDto(st);
    }

    @Override
    @Transactional
    public StaffDetailDto createStaff(StaffCreateRequestDto req) {
        if (staffRepo.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Email '" + req.getEmail() + "' đã được sử dụng");
        }

        Store store = storeRepo.findById(req.getStoreId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy chi nhánh #" + req.getStoreId()));

        Role role = roleRepo.findById(req.getRoleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy role #" + req.getRoleId()));

        Staff st = new Staff();
        st.setFullName(req.getFullName());
        st.setEmail(req.getEmail());
        st.setPhone(req.getPhone());
        st.setStore(store);
        st.setRole(role);
        st.setIsActive(!"inactive".equalsIgnoreCase(req.getStatus()));

        // Set password: dùng giá trị truyền vào hoặc placeholder (gửi email invite)
        String rawPassword = req.getPassword() != null && !req.getPassword().isBlank()
                ? req.getPassword()
                : generateTempPassword();
        st.setPasswordHash(passwordEncoder.encode(rawPassword));

        // TODO: nếu req.getPassword() == null → gửi email mời qua MailService

        return toDetailDto(staffRepo.save(st));
    }

    @Override
    @Transactional
    public StaffDetailDto updateStaff(Long id, StaffUpdateRequestDto req) {
        Staff st = staffRepo.findWithRelationsById(id).orElseThrow(() -> notFound(id));

        if (req.getFullName() != null) st.setFullName(req.getFullName());
        if (req.getPhone()    != null) st.setPhone(req.getPhone());
        if (req.getStatus()   != null) st.setIsActive(parseActive(req.getStatus()));

        if (req.getEmail() != null && !req.getEmail().equals(st.getEmail())) {
            if (staffRepo.existsByEmailAndIdNot(req.getEmail(), id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Email '" + req.getEmail() + "' đã được sử dụng");
            }
            st.setEmail(req.getEmail());
        }

        if (req.getStoreId() != null) {
            Store store = storeRepo.findById(req.getStoreId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Không tìm thấy chi nhánh #" + req.getStoreId()));
            st.setStore(store);
        }

        if (req.getRoleId() != null) {
            Role role = roleRepo.findById(req.getRoleId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Không tìm thấy role #" + req.getRoleId()));
            st.setRole(role);
        }

        return toDetailDto(staffRepo.save(st));
    }

    @Override
    @Transactional
    public void changeStatus(Long id, String status) {
        boolean active = toActive(status);
        int updated = staffRepo.setActive(id, active);
        if (updated == 0) throw notFound(id);
    }

    @Override
    @Transactional
    public void deleteStaff(Long id) {
        if (!staffRepo.existsById(id)) throw notFound(id);
        staffRepo.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public void resetPassword(Long id, boolean sendEmail) {
        Staff st = staffRepo.findById(id).orElseThrow(() -> notFound(id));
        if (!Boolean.TRUE.equals(st.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Tài khoản đang bị khoá");
        }
        // TODO: tạo reset token + gửi email qua MailService nếu sendEmail=true
        // Placeholder: reset sang temp password
        String temp = generateTempPassword();
        st.setPasswordHash(passwordEncoder.encode(temp));
        staffRepo.save(st);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportStaff(Long storeId, String role, String status) {
        List<Staff> list = staffRepo.findForExport(storeId, blankToNull(role), parseActive(status));
        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Nhân viên");
            String[] headers = {"ID", "Họ tên", "Email", "SĐT",
                    "Chi nhánh", "Role", "Trạng thái"};
            CellStyle hs = buildHeaderStyle(wb);
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell c = hRow.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(hs);
            }
            for (int i = 0; i < list.size(); i++) {
                Staff st = list.get(i);
                Row row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(st.getId());
                row.createCell(1).setCellValue(st.getFullName());
                row.createCell(2).setCellValue(st.getEmail());
                row.createCell(3).setCellValue(st.getPhone() != null ? st.getPhone() : "");
                row.createCell(4).setCellValue(st.getStore() != null ? st.getStore().getName() : "");
                row.createCell(5).setCellValue(st.getRole() != null ? st.getRole().getName() : "");
                row.createCell(6).setCellValue(Boolean.TRUE.equals(st.getIsActive()) ? "active" : "inactive");
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi xuất XLSX: " + e.getMessage(), e);
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private StaffListDto toListDto(Staff st) {
        return new StaffListDto(
                st.getId(), st.getFullName(), st.getEmail(), st.getPhone(),
                st.getStore() != null ? st.getStore().getName() : null,
                st.getRole()  != null ? st.getRole().getName()  : null,
                Boolean.TRUE.equals(st.getIsActive()) ? "active" : "inactive"
        );
    }

    private StaffDetailDto toDetailDto(Staff st) {
        List<String> permissions = parsePermissions(
                st.getRole() != null ? st.getRole().getPermissions() : null);
        return new StaffDetailDto(
                st.getId(), st.getFullName(), st.getEmail(), st.getPhone(),
                st.getStore() != null ? st.getStore().getId()   : null,
                st.getStore() != null ? st.getStore().getName() : null,
                st.getRole()  != null ? st.getRole().getId()    : null,
                st.getRole()  != null ? st.getRole().getName()  : null,
                permissions,
                Boolean.TRUE.equals(st.getIsActive()) ? "active" : "inactive",
                st.getCreatedAt(), st.getUpdatedAt()
        );
    }

    private List<String> parsePermissions(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private Boolean parseActive(String status) {
        if (status == null || status.isBlank()) return null;
        return !"inactive".equalsIgnoreCase(status);
    }

    private boolean toActive(String status) {
        return switch (status.toLowerCase().trim()) {
            case "active"   -> true;
            case "inactive" -> false;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Trạng thái không hợp lệ: " + status);
        };
    }

    /** Tạo mật khẩu tạm thời ngẫu nhiên. */
    private String generateTempPassword() {
        return "Temp@" + java.util.UUID.randomUUID().toString().substring(0, 8);
    }

    private ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Không tìm thấy nhân viên #" + id);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private CellStyle buildHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont(); font.setBold(true); style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }
}
