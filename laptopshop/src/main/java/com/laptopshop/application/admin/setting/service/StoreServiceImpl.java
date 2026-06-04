package com.laptopshop.application.admin.setting.service;

import com.laptopshop.application.admin.refund.dto.PageDto;
import com.laptopshop.application.admin.setting.dto.StoreCreateRequestDto;
import com.laptopshop.application.admin.setting.dto.StoreDetailDto;
import com.laptopshop.application.admin.setting.dto.StoreListDto;
import com.laptopshop.application.admin.setting.dto.StoreUpdateRequestDto;
import com.laptopshop.domain.store.entity.Store;
import com.laptopshop.domain.store.repository.StaffRepository;
import com.laptopshop.domain.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StoreServiceImpl implements StoreService {

    private final StoreRepository storeRepo;
    private final StaffRepository staffRepo;

    @Override
    @Transactional(readOnly = true)
    public PageDto<StoreListDto> searchStores(String q, String status, Pageable pageable) {
        Page<Store> page = storeRepo.searchStores(blankToNull(q), parseActive(status), pageable);
        return PageDto.of(page.map(this::toListDto));
    }

    @Override
    @Transactional(readOnly = true)
    public StoreDetailDto getStore(Long id) {
        Store s = storeRepo.findById(id).orElseThrow(() -> notFound(id));
        long staffCount = staffRepo.countByStoreId(id);
        return toDetailDto(s, (int) staffCount);
    }

    @Override
    @Transactional
    public StoreDetailDto createStore(StoreCreateRequestDto req) {
        if (storeRepo.existsByName(req.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Chi nhánh tên '" + req.getName() + "' đã tồn tại");
        }
        Store s = new Store();
        applyCreateFields(s, req);
        Store saved = storeRepo.save(s);
        return toDetailDto(saved, 0);
    }

    @Override
    @Transactional
    public StoreDetailDto updateStore(Long id, StoreUpdateRequestDto req) {
        Store s = storeRepo.findById(id).orElseThrow(() -> notFound(id));

        if (req.getName() != null) {
            if (storeRepo.existsByNameAndIdNot(req.getName(), id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Tên chi nhánh '" + req.getName() + "' đã được sử dụng");
            }
            s.setName(req.getName());
        }
        if (req.getAddress()  != null) s.setAddress(req.getAddress());
        if (req.getDistrict() != null) s.setDistrict(req.getDistrict());
        if (req.getCity()     != null) s.setCity(req.getCity());
        if (req.getPhone()    != null) s.setPhone(req.getPhone());
        if (req.getEmail()    != null) s.setEmail(req.getEmail());
        if (req.getStatus()   != null) s.setIsActive(parseActive(req.getStatus()));

        storeRepo.save(s);
        long staffCount = staffRepo.countByStoreId(id);
        return toDetailDto(s, (int) staffCount);
    }

    @Override
    @Transactional
    public void changeStatus(Long id, String status) {
        boolean active = toActive(status);
        int updated = storeRepo.setActive(id, active);
        if (updated == 0) throw notFound(id);
    }

    @Override
    @Transactional
    public void deleteStore(Long id) {
        if (!storeRepo.existsById(id)) throw notFound(id);
        long staffCount = staffRepo.countByStoreId(id);
        if (staffCount > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Chi nhánh còn " + staffCount + " nhân viên, không thể xoá.");
        }
        storeRepo.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportStores(String status) {
        List<Store> list = storeRepo.findForExport(parseActive(status));
        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Chi nhánh");
            String[] headers = {"ID", "Tên", "Địa chỉ", "Quận/Huyện",
                    "Thành phố", "SĐT", "Email", "Trạng thái"};
            CellStyle hs = buildHeaderStyle(wb);
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell c = hRow.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(hs);
            }
            for (int i = 0; i < list.size(); i++) {
                Store s = list.get(i);
                Row row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(s.getId());
                row.createCell(1).setCellValue(s.getName());
                row.createCell(2).setCellValue(s.getAddress());
                row.createCell(3).setCellValue(s.getDistrict() != null ? s.getDistrict() : "");
                row.createCell(4).setCellValue(s.getCity());
                row.createCell(5).setCellValue(s.getPhone() != null ? s.getPhone() : "");
                row.createCell(6).setCellValue(s.getEmail() != null ? s.getEmail() : "");
                row.createCell(7).setCellValue(Boolean.TRUE.equals(s.getIsActive()) ? "active" : "inactive");
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi xuất XLSX: " + e.getMessage(), e);
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private void applyCreateFields(Store s, StoreCreateRequestDto req) {
        s.setName(req.getName());
        s.setAddress(req.getAddress());
        s.setDistrict(req.getDistrict());
        s.setCity(req.getCity());
        s.setPhone(req.getPhone());
        s.setEmail(req.getEmail());
        s.setIsActive(!"inactive".equalsIgnoreCase(req.getStatus()));
    }

    private StoreListDto toListDto(Store s) {
        return new StoreListDto(s.getId(), s.getName(), s.getAddress(),
                s.getPhone(), s.getCity(),
                Boolean.TRUE.equals(s.getIsActive()) ? "active" : "inactive");
    }

    private StoreDetailDto toDetailDto(Store s, int staffCount) {
        return new StoreDetailDto(
                s.getId(), s.getName(), s.getAddress(), s.getDistrict(),
                s.getCity(), s.getPhone(), s.getEmail(),
                s.getLatitude(), s.getLongitude(),
                Boolean.TRUE.equals(s.getIsActive()) ? "active" : "inactive",
                s.getCreatedAt(), s.getUpdatedAt(), staffCount);
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

    private ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Không tìm thấy chi nhánh #" + id);
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