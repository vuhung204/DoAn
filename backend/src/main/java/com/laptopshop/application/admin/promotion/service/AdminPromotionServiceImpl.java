package com.laptopshop.application.admin.promotion.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.laptopshop.application.admin.promotion.dto.*;
import com.laptopshop.application.admin.refund.dto.PageDto;
import com.laptopshop.domain.order.entity.Promotion;
import com.laptopshop.domain.order.entity.PromotionProduct;
import com.laptopshop.domain.order.enums.DiscountType;
import com.laptopshop.domain.order.repository.PromotionProductRepository;
import com.laptopshop.domain.order.repository.PromotionRepository;
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
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminPromotionServiceImpl implements AdminPromotionService {

    private final PromotionRepository        promotionRepo;
    private final PromotionProductRepository promoProductRepo;
    private final ObjectMapper               objectMapper;

    // ── SEARCH ───────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageDto<PromotionListDto> searchPromotions(String q, String status, String type,
                                                      LocalDateTime from, LocalDateTime to,
                                                      Pageable pageable) {
        Page<Object[]> page = promotionRepo.searchPromotions(
                blankToNull(q), blankToNull(status),
                typeToDb(type), from, to, pageable);
        return PageDto.of(page.map(this::rowToListDto));
    }

    // ── DETAIL ───────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PromotionDetailDto getPromotion(Long id) {
        Promotion p = promotionRepo.findDetailById(id)
                .orElseThrow(() -> notFound(id));
        return toDetailDto(p);
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PromotionDetailDto createPromotion(PromotionCreateRequestDto dto, String createdBy) {
        // Validate unique code (case-insensitive)
        if (promotionRepo.existsByCodeIgnoreCase(dto.getCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Mã khuyến mãi '" + dto.getCode() + "' đã tồn tại");
        }
        validateDateRange(dto.getStartDate(), dto.getEndDate());
        validateDiscount(dto.getType(), dto.getDiscount());

        Promotion p = new Promotion();
        applyCreateFields(p, dto);
        p.setCreatedBy(createdBy);

        Promotion saved = promotionRepo.save(p);

        // Gán sản phẩm nếu applyMode=select
        if ("select".equalsIgnoreCase(dto.getApplyMode())
                && dto.getProductIds() != null && !dto.getProductIds().isEmpty()) {
            assignProductsToPromotion(saved, dto.getProductIds());
        }

        return toDetailDto(promotionRepo.findDetailById(saved.getId()).orElseThrow());
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PromotionDetailDto updatePromotion(Long id, PromotionUpdateRequestDto dto) {
        Promotion p = promotionRepo.findById(id).orElseThrow(() -> notFound(id));

        if (dto.getName()          != null) p.setName(dto.getName());
        if (dto.getDescription()   != null) p.setDescription(dto.getDescription());
        if (dto.getDiscount()      != null) {
            if (dto.getType() != null) validateDiscount(dto.getType(), dto.getDiscount());
            p.setDiscountValue(dto.getDiscount());
        }
        if (dto.getType()          != null) p.setDiscountType(DiscountType.fromFrontend(dto.getType()));
        if (dto.getMaxDiscount()   != null) p.setMaxDiscount(dto.getMaxDiscount());
        if (dto.getMinOrderAmount()!= null) p.setMinOrderAmount(dto.getMinOrderAmount());
        if (dto.getMinQty()        != null) p.setMinQty(dto.getMinQty());
        if (dto.getMaxUses()       != null) p.setMaxUses(dto.getMaxUses());
        if (dto.getMaxUsesPerUser()!= null) p.setMaxUsesPerUser(dto.getMaxUsesPerUser());
        if (dto.getApplyMode()     != null) p.setApplyMode(dto.getApplyMode());
        if (dto.getCategoryIds()   != null) p.setCategoryIds(toJson(dto.getCategoryIds()));

        if (dto.getStartDate() != null || dto.getEndDate() != null) {
            LocalDate start = dto.getStartDate() != null
                    ? dto.getStartDate() : p.getStartsAt().toLocalDate();
            LocalDate end   = dto.getEndDate()   != null
                    ? dto.getEndDate()   : p.getEndsAt().toLocalDate();
            validateDateRange(start, end);
            if (dto.getStartDate() != null)
                p.setStartsAt(dto.getStartDate().atStartOfDay());
            if (dto.getEndDate() != null)
                p.setEndsAt(dto.getEndDate().atTime(23, 59, 59));
        }

        promotionRepo.save(p);

        // Cập nhật gán sản phẩm nếu có
        if (dto.getProductIds() != null) {
            promoProductRepo.deleteByPromotionId(id);
            if (!dto.getProductIds().isEmpty()) {
                assignProductsToPromotion(p, dto.getProductIds());
            }
        }

        return toDetailDto(promotionRepo.findDetailById(id).orElseThrow());
    }

    // ── STATUS ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void changeStatus(Long id, String status) {
        boolean active = switch (status.toLowerCase().trim()) {
            case "active"   -> true;
            case "inactive" -> false;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Trạng thái không hợp lệ: " + status);
        };
        int updated = promotionRepo.setActive(id, active);
        if (updated == 0) throw notFound(id);
    }

    // ── DELETE ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void deletePromotion(Long id) {
        if (!promotionRepo.existsById(id)) throw notFound(id);
        promotionRepo.deleteById(id);
    }

    // ── ASSIGN PRODUCTS ──────────────────────────────────────────────────────

    @Override
    @Transactional
    public void assignProducts(Long id, PromotionProductAssignRequestDto dto) {
        Promotion p = promotionRepo.findById(id).orElseThrow(() -> notFound(id));
        promoProductRepo.deleteByPromotionId(id);
        assignProductsToPromotion(p, dto.getProductIds());
        // Cập nhật applyMode nếu cần
        if (!"select".equalsIgnoreCase(p.getApplyMode())) {
            p.setApplyMode("select");
            promotionRepo.save(p);
        }
    }

    // ── VALIDATE CODE ────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PromotionValidateResponseDto validateCode(String code, Long excludeId) {
        boolean exists = excludeId != null
                ? promotionRepo.existsByCodeIgnoreCaseAndIdNot(code, excludeId)
                : promotionRepo.existsByCodeIgnoreCase(code);
        return exists
                ? new PromotionValidateResponseDto(false, "Mã '" + code + "' đã được sử dụng")
                : new PromotionValidateResponseDto(true, "Mã hợp lệ");
    }

    // ── INCREMENT USED COUNT ─────────────────────────────────────────────────

    @Override
    @Transactional
    public boolean incrementUsedCountIfAllowed(Long id, int delta) {
        return promotionRepo.incrementUsedCount(id, delta) > 0;
    }

    // ── EXPORT ───────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public byte[] exportPromotions(ExportPromotionsRequestDto req) {
        List<Object[]> rows = promotionRepo.findForExport(
                blankToNull(req.getQ()),
                typeToDb(req.getType()),
                req.getFromDate(), req.getToDate());

        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.createSheet("Khuyến mãi");
            String[] headers = {"ID", "Mã", "Tên", "Loại", "Giảm giá",
                    "Giảm tối đa", "Ngày bắt đầu", "Ngày kết thúc",
                    "Đã dùng", "Tối đa", "Trạng thái"};

            CellStyle hs = buildHeaderStyle(wb);
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell c = hRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(hs);
            }

            for (int i = 0; i < rows.size(); i++) {
                Object[] r = rows.get(i);
                Row row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(((Number) r[0]).longValue());
                row.createCell(1).setCellValue((String) r[1]);
                row.createCell(2).setCellValue((String) r[2]);
                row.createCell(3).setCellValue(r[3] != null
                        ? DiscountType.valueOf((String) r[3]).toFrontend() : "");
                row.createCell(4).setCellValue(r[4] != null
                        ? new BigDecimal(r[4].toString()).doubleValue() : 0);
                row.createCell(5).setCellValue(r[5] != null
                        ? new BigDecimal(r[5].toString()).doubleValue() : 0);
                row.createCell(6).setCellValue(r[6] != null ? r[6].toString() : "");
                row.createCell(7).setCellValue(r[7] != null ? r[7].toString() : "");
                row.createCell(8).setCellValue(r[8] != null ? ((Number) r[8]).intValue() : 0);
                row.createCell(9).setCellValue(r[9] != null ? ((Number) r[9]).intValue() : 0);
                row.createCell(10).setCellValue(r[10] != null ? (String) r[10] : "");
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi xuất XLSX: " + e.getMessage(), e);
        }
    }

    // ── PRIVATE HELPERS ──────────────────────────────────────────────────────

    private void applyCreateFields(Promotion p, PromotionCreateRequestDto dto) {
        p.setCode(dto.getCode().toUpperCase().trim());
        p.setName(dto.getName());
        p.setDescription(dto.getDescription());
        p.setDiscountType(DiscountType.fromFrontend(dto.getType()));
        p.setDiscountValue(dto.getDiscount());
        p.setMaxDiscount(dto.getMaxDiscount());
        p.setMinOrderAmount(dto.getMinOrderAmount() != null
                ? dto.getMinOrderAmount() : BigDecimal.ZERO);
        p.setMinQty(dto.getMinQty() != null ? dto.getMinQty() : 0);
        p.setMaxUses(dto.getMaxUses());
        p.setMaxUsesPerUser(dto.getMaxUsesPerUser());
        p.setApplyMode(dto.getApplyMode() != null ? dto.getApplyMode() : "all");
        p.setStartsAt(dto.getStartDate().atStartOfDay());
        p.setEndsAt(dto.getEndDate().atTime(23, 59, 59));
        p.setIsActive(true);
        if (dto.getCategoryIds() != null) {
            p.setCategoryIds(toJson(dto.getCategoryIds()));
        }
    }

    private void assignProductsToPromotion(Promotion p, List<Long> productIds) {
        productIds.forEach(productId -> {
            PromotionProduct pp = new PromotionProduct();
            pp.setPromotion(p);
            com.laptopshop.domain.catalog.entity.Product prod =
                    new com.laptopshop.domain.catalog.entity.Product();
            prod.setId(productId);
            pp.setProduct(prod);
            promoProductRepo.save(pp);
        });
    }

    private PromotionListDto rowToListDto(Object[] r) {
        return new PromotionListDto(
                ((Number) r[0]).longValue(),
                (String) r[1],
                (String) r[2],
                r[3] != null ? DiscountType.valueOf((String) r[3]).toFrontend() : null,
                r[4] != null ? new BigDecimal(r[4].toString()) : null,
                r[5] != null ? new BigDecimal(r[5].toString()) : null,
                r[6] != null ? LocalDate.parse(r[6].toString()) : null,
                r[7] != null ? LocalDate.parse(r[7].toString()) : null,
                r[8] != null ? ((Number) r[8]).intValue() : 0,
                r[9] != null ? ((Number) r[9]).intValue() : null,
                (String) r[10]
        );
    }

    private PromotionDetailDto toDetailDto(Promotion p) {
        List<Long> productIds = p.getPromotionProducts() != null
                ? p.getPromotionProducts().stream()
                .map(pp -> pp.getProduct().getId())
                .collect(Collectors.toList())
                : List.of();

        List<Long> categoryIds = fromJson(p.getCategoryIds());

        String status = computeStatus(p);

        return new PromotionDetailDto(
                p.getId(), p.getCode(), p.getName(), p.getDescription(),
                p.getDiscountType().toFrontend(),
                p.getDiscountValue(), p.getMaxDiscount(), p.getMinOrderAmount(),
                p.getMinQty(),
                p.getStartsAt() != null ? p.getStartsAt().toLocalDate() : null,
                p.getEndsAt()   != null ? p.getEndsAt().toLocalDate()   : null,
                p.getUsedCount(), p.getMaxUses(), p.getMaxUsesPerUser(),
                p.getApplyMode(), productIds, categoryIds,
                status, p.getIsActive(),
                p.getCreatedBy(), p.getCreatedAt()
        );
    }

    private String computeStatus(Promotion p) {
        if (!Boolean.TRUE.equals(p.getIsActive())) return "inactive";
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(p.getStartsAt())) return "upcoming";
        if (now.isAfter(p.getEndsAt()))    return "expired";
        return "active";
    }

    private void validateDateRange(LocalDate start, LocalDate end) {
        if (start != null && end != null && start.isAfter(end)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Ngày bắt đầu phải trước ngày kết thúc");
        }
    }

    private void validateDiscount(String type, BigDecimal discount) {
        if (discount == null) return;
        if ("percent".equalsIgnoreCase(type)
                && (discount.compareTo(BigDecimal.ZERO) < 0
                || discount.compareTo(BigDecimal.valueOf(100)) > 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Phần trăm giảm giá phải từ 0 đến 100");
        }
        if (!"percent".equalsIgnoreCase(type) && discount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Giá trị giảm phải lớn hơn 0");
        }
    }

    private String typeToDb(String frontendType) {
        if (frontendType == null || frontendType.isBlank()) return null;
        return DiscountType.fromFrontend(frontendType).name();
    }

    private String toJson(List<Long> ids) {
        try {
            return objectMapper.writeValueAsString(ids);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private List<Long> fromJson(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<Long>>() {});
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Không tìm thấy khuyến mãi #" + id);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private CellStyle buildHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }
}