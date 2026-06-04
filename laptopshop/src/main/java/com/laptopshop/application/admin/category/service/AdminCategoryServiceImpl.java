package com.laptopshop.application.admin.category.service;

import com.laptopshop.application.admin.category.dto.*;
import com.laptopshop.application.admin.refund.dto.PageDto;
import com.laptopshop.domain.catalog.entity.Category;
import com.laptopshop.domain.catalog.repository.CategoryRepository;
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
import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminCategoryServiceImpl implements AdminCategoryService {

    private final CategoryRepository categoryRepo;

    // ── TREE ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<CategoryTreeDto> getCategoryTree() {
        List<Category> all = categoryRepo.findAllOrdered();
        Map<Long, Integer> productCounts = buildProductCountMap(all);

        Map<Long, List<Category>> childrenMap = all.stream()
                .filter(c -> c.getParent() != null)
                .collect(Collectors.groupingBy(c -> c.getParent().getId()));

        return all.stream()
                .filter(c -> c.getParent() == null)
                .map(c -> buildTreeDto(c, childrenMap, productCounts))
                .collect(Collectors.toList());
    }

    private CategoryTreeDto buildTreeDto(Category c,
                                         Map<Long, List<Category>> childrenMap,
                                         Map<Long, Integer> productCounts) {
        List<CategoryTreeDto> childDtos = childrenMap
                .getOrDefault(c.getId(), List.of())
                .stream()
                .map(child -> buildTreeDto(child, childrenMap, productCounts))
                .collect(Collectors.toList());

        return new CategoryTreeDto(
                c.getId(), c.getName(), c.getSlug(),
                c.getIsActive(),
                productCounts.getOrDefault(c.getId(), 0),
                childDtos
        );
    }

    // ── LIST (flat) ───────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageDto<CategoryDto> listCategories(String q, Boolean visible, Pageable pageable) {
        Page<Category> page = categoryRepo.searchCategories(blankToNull(q), visible, pageable);
        return PageDto.of(page.map(c -> toCategoryDto(c,
                categoryRepo.countProductsByCategory(c.getId()))));
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CategoryDto createCategory(CreateCategoryRequestDto req) {
        String slug = resolveSlug(req.getSlug(), req.getName(), null);

        Category category = new Category();
        category.setName(req.getName());
        category.setSlug(slug);
        category.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        category.setIsActive(req.getVisible() != null ? req.getVisible() : true);

        if (req.getParentId() != null) {
            Category parent = categoryRepo.findById(req.getParentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Danh mục cha #" + req.getParentId() + " không tồn tại"));
            category.setParent(parent);
        }

        Category saved = categoryRepo.save(category);
        return toCategoryDto(saved, 0);
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CategoryDto updateCategory(Long id, UpdateCategoryRequestDto req) {
        Category category = categoryRepo.findById(id)
                .orElseThrow(() -> notFound(id));

        if (req.getName() != null)      category.setName(req.getName());
        if (req.getSortOrder() != null) category.setSortOrder(req.getSortOrder());
        if (req.getVisible() != null)   category.setIsActive(req.getVisible());

        if (req.getSlug() != null || req.getName() != null) {
            String newSlug = resolveSlug(req.getSlug(),
                    req.getName() != null ? req.getName() : category.getName(), id);
            category.setSlug(newSlug);
        }

        if (req.getParentId() != null) {
            if (req.getParentId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Danh mục không thể là cha của chính nó");
            }
            List<Long> descendants = categoryRepo.findDescendantIds(id);
            if (descendants.contains(req.getParentId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không thể đặt danh mục con làm cha (tạo vòng lặp)");
            }
            Category newParent = categoryRepo.findById(req.getParentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Danh mục cha #" + req.getParentId() + " không tồn tại"));
            category.setParent(newParent);
        }

        Category saved = categoryRepo.save(category);
        return toCategoryDto(saved, categoryRepo.countProductsByCategory(id));
    }

    // ── DELETE ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void deleteCategory(Long id, boolean force) {
        Category category = categoryRepo.findById(id)
                .orElseThrow(() -> notFound(id));

        int productCount = categoryRepo.countProductsByCategory(id);
        List<Long> descendantIds = categoryRepo.findDescendantIds(id);

        if (!force) {
            if (!descendantIds.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Danh mục có " + descendantIds.size()
                                + " danh mục con. Dùng force=true để xoá toàn bộ.");
            }
            if (productCount > 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Danh mục có " + productCount
                                + " sản phẩm. Dùng force=true để xoá hoặc chuyển sản phẩm trước.");
            }
        }

        if (!descendantIds.isEmpty()) {
            descendantIds.forEach(dId -> categoryRepo.findById(dId)
                    .ifPresent(categoryRepo::delete));
        }

        categoryRepo.delete(category);
    }

    // ── VISIBILITY ───────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void setVisibility(Long id, boolean visible) {
        int updated = categoryRepo.setVisibility(id, visible);
        if (updated == 0) throw notFound(id);
    }

    // ── REORDER ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void reorderCategories(ReorderCategoryRequestDto req) {
        List<Long> ids = req.getOrderedCategoryIds();
        for (int i = 0; i < ids.size(); i++) {
            categoryRepo.updateSortOrder(ids.get(i), i);
        }
    }

    // ── EXPORT ───────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public byte[] exportCategories() {
        List<Category> all = categoryRepo.findAllOrdered();

        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.createSheet("Danh mục");
            String[] headers = {"ID", "Tên", "Slug", "Danh mục cha",
                    "Thứ tự", "Hiển thị", "Số sản phẩm"};

            CellStyle hs = buildHeaderStyle(wb);
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell c = hRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(hs);
            }

            for (int i = 0; i < all.size(); i++) {
                Category c = all.get(i);
                Row row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(c.getId());
                row.createCell(1).setCellValue(c.getName());
                row.createCell(2).setCellValue(c.getSlug());
                row.createCell(3).setCellValue(
                        c.getParent() != null ? c.getParent().getName() : "");
                row.createCell(4).setCellValue(c.getSortOrder());
                row.createCell(5).setCellValue(
                        Boolean.TRUE.equals(c.getIsActive()) ? "Có" : "Không");
                row.createCell(6).setCellValue(
                        categoryRepo.countProductsByCategory(c.getId()));
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi xuất XLSX: " + e.getMessage(), e);
        }
    }

    // ── PRIVATE HELPERS ──────────────────────────────────────────────────────

    private CategoryDto toCategoryDto(Category c, int productCount) {
        return new CategoryDto(
                c.getId(), c.getName(), c.getSlug(),
                c.getParent() != null ? c.getParent().getId() : null,
                c.getSortOrder(), c.getIsActive(),
                productCount, c.getCreatedAt(), c.getUpdatedAt()
        );
    }

    private Map<Long, Integer> buildProductCountMap(List<Category> all) {
        Map<Long, Integer> map = new HashMap<>();
        all.forEach(c -> map.put(c.getId(),
                categoryRepo.countProductsByCategory(c.getId())));
        return map;
    }

    private String resolveSlug(String slugInput, String name, Long excludeId) {
        String slug = (slugInput != null && !slugInput.isBlank())
                ? slugInput.trim().toLowerCase()
                : toSlug(name);

        boolean exists = excludeId != null
                ? categoryRepo.existsBySlugAndIdNot(slug, excludeId)
                : categoryRepo.existsBySlug(slug);

        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Slug '" + slug + "' đã được sử dụng");
        }
        return slug;
    }

    public static String toSlug(String name) {
        if (name == null) return "";
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD);
        // Xoá dấu tiếng Việt
        String noAccent = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return noAccent.toLowerCase()
                .replaceAll("đ", "d")
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }

    private ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Không tìm thấy danh mục #" + id);
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