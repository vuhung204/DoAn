package com.laptopshop.application.admin.brand.service;

import com.laptopshop.application.admin.brand.dto.*;
import com.laptopshop.application.admin.dashboard.dto.PageDto;
import com.laptopshop.domain.catalog.entity.Brand;
import com.laptopshop.domain.catalog.repository.BrandRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.text.Normalizer;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminBrandServiceImpl implements AdminBrandService {

    private final BrandRepository brandRepository;

    // ══════════════════════════════════════════════════════════════════════
    // 1. listBrands
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public PageDto<BrandDto> listBrands(String q, Boolean active, Pageable pageable) {
        String qParam = (q != null && !q.isBlank()) ? q.trim() : null;

        Page<Brand> page = brandRepository.search(qParam, active, pageable);

        // Lấy productCount cho từng brand trong page (batch native)
        List<Long> brandIds = page.getContent().stream()
                .map(Brand::getId).collect(Collectors.toList());
        Map<Long, Long> countMap = buildProductCountMap(qParam, active);

        List<BrandDto> content = page.getContent().stream()
                .map(b -> toBrandDto(b, countMap.getOrDefault(b.getId(), 0L).intValue()))
                .collect(Collectors.toList());

        return PageDto.from(new PageImpl<>(content, pageable, page.getTotalElements()));
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. getBrand
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public BrandDto getBrand(Long id) {
        Brand brand = findOrThrow(id);
        int count = (int) brandRepository.countProductsByBrand(id);
        return toBrandDto(brand, count);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 3. createBrand
    // ══════════════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public BrandDto createBrand(CreateBrandRequestDto dto) {
        // Resolve slug
        String slug = resolveSlug(dto.getSlug(), dto.getName());

        // Validate uniqueness
        if (brandRepository.existsBySlug(slug))
            throw new IllegalArgumentException("Slug đã tồn tại: " + slug);

        Brand brand = new Brand();
        brand.setName(dto.getName());
        brand.setSlug(slug);
        brand.setLogoUrl(dto.getLogoUrl());
        brand.setDescription(dto.getDescription());
        brand.setWebsite(dto.getWebsite());
        brand.setIsActive(Boolean.TRUE.equals(dto.getActive()));

        Brand saved = brandRepository.save(brand);
        log.info("Brand created: {} (slug={})", saved.getName(), saved.getSlug());
        return toBrandDto(saved, 0);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 4. updateBrand
    // ══════════════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public BrandDto updateBrand(Long id, UpdateBrandRequestDto dto) {
        Brand brand = findOrThrow(id);

        if (dto.getName() != null) brand.setName(dto.getName());

        if (dto.getSlug() != null) {
            String newSlug = generateSlug(dto.getSlug());
            if (brandRepository.existsBySlugAndIdNot(newSlug, id))
                throw new IllegalArgumentException("Slug đã tồn tại: " + newSlug);
            brand.setSlug(newSlug);
        }

        if (dto.getLogoUrl()     != null) brand.setLogoUrl(dto.getLogoUrl());
        if (dto.getDescription() != null) brand.setDescription(dto.getDescription());
        if (dto.getWebsite()     != null) brand.setWebsite(dto.getWebsite());
        if (dto.getActive()      != null) brand.setIsActive(dto.getActive());

        brandRepository.save(brand);
        int count = (int) brandRepository.countProductsByBrand(id);
        return toBrandDto(brand, count);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 5. deleteBrand
    // ══════════════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public void deleteBrand(Long id, boolean force) {
        Brand brand = findOrThrow(id);
        long productCount = brandRepository.countProductsByBrand(id);

        if (productCount > 0) {
            // Policy mặc định: không xóa cascade dù force=true — an toàn cho data
            throw new IllegalStateException(
                    String.format("Brand '%s' còn %d sản phẩm. Hãy chuyển hoặc xoá sản phẩm trước.",
                            brand.getName(), productCount));
        }

        brandRepository.deleteById(id);
        log.info("Brand {} deleted", id);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 6. setActive
    // ══════════════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public void setActive(Long id, boolean active) {
        int updated = brandRepository.updateActive(id, active);
        if (updated == 0)
            throw new NoSuchElementException("Brand không tồn tại: " + id);
        log.info("Brand {} active → {}", id, active);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 7. getStats
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public BrandStatsDto getStats() {
        int total             = (int) brandRepository.count();
        int active            = (int) brandRepository.countByIsActiveTrue();
        int withProducts      = brandRepository.countBrandsWithProducts();
        int totalProducts     = brandRepository.countTotalActiveProducts();

        return new BrandStatsDto(total, active, withProducts, totalProducts);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 8. exportBrands — Apache POI (XLSX) hoặc CSV
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public byte[] exportBrands(BrandExportRequestDto req) {
        String qParam = (req.getQ() != null && !req.getQ().isBlank()) ? req.getQ().trim() : null;
        List<Object[]> rows = brandRepository.findAllWithProductCount(qParam, req.getActive());

        if ("csv".equalsIgnoreCase(req.getFormat())) {
            return exportAsCsv(rows);
        }
        return exportAsXlsx(rows);
    }

    // ── XLSX ──────────────────────────────────────────────────────────────
    private byte[] exportAsXlsx(List<Object[]> rows) {
        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.createSheet("Thương hiệu");
            CellStyle hs = buildHeaderStyle(wb);
            CellStyle ns = buildNumberStyle(wb);

            String[] cols = {"ID", "Tên", "Slug", "Website",
                    "Trạng thái", "Số sản phẩm", "Ngày tạo"};
            Row header = sheet.createRow(0);
            for (int c = 0; c < cols.length; c++) {
                createCell(header, c, cols[c], hs);
                sheet.setColumnWidth(c, 5000);
            }
            sheet.setColumnWidth(1, 7000);

            DateTimeFormatter dtFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            int i = 1;
            for (Object[] r : rows) {
                Row row = sheet.createRow(i++);
                row.createCell(0).setCellValue(((Number) r[0]).longValue());
                createCell(row, 1, (String) r[1], null);
                createCell(row, 2, r[2] != null ? (String) r[2] : "", null);
                createCell(row, 3, r[5] != null ? (String) r[5] : "", null); // website idx=5
                createCell(row, 4, toBool(r[6]) ? "Hoạt động" : "Tạm dừng", null);
                row.createCell(5).setCellValue(((Number) r[7]).longValue()); // productCount
                // createdAt idx=8
                String dt = "";
                if (r[8] instanceof java.sql.Timestamp ts)
                    dt = ts.toLocalDateTime().format(dtFmt);
                createCell(row, 6, dt, null);
            }

            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Brand XLSX export failed", e);
            throw new RuntimeException("Không thể xuất file XLSX", e);
        }
    }

    // ── CSV ───────────────────────────────────────────────────────────────
    private byte[] exportAsCsv(List<Object[]> rows) {
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Tên,Slug,Website,Trạng thái,Số sản phẩm,Ngày tạo\n");
        DateTimeFormatter dtFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        for (Object[] r : rows) {
            sb.append(((Number) r[0]).longValue()).append(',');
            sb.append(csvEsc(r[1])).append(',');
            sb.append(csvEsc(r[2])).append(',');
            sb.append(csvEsc(r[5])).append(','); // website
            sb.append(toBool(r[6]) ? "Hoạt động" : "Tạm dừng").append(',');
            sb.append(((Number) r[7]).longValue()).append(',');
            String dt = "";
            if (r[8] instanceof java.sql.Timestamp ts)
                dt = ts.toLocalDateTime().format(dtFmt);
            sb.append(dt).append('\n');
        }
        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private Brand findOrThrow(Long id) {
        return brandRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Brand không tồn tại: " + id));
    }

    private BrandDto toBrandDto(Brand b, int productCount) {
        return new BrandDto(
                b.getId(), b.getName(), b.getSlug(), b.getLogoUrl(),
                b.getDescription(), b.getWebsite(), b.getIsActive(),
                productCount, b.getCreatedAt(), b.getUpdatedAt()
        );
    }

    /**
     * Build map brandId → productCount từ native query findAllWithProductCount.
     * Dùng để enrich page results mà không N+1.
     */
    private Map<Long, Long> buildProductCountMap(String q, Boolean active) {
        Map<Long, Long> map = new HashMap<>();
        brandRepository.findAllWithProductCount(q, active).forEach(r ->
                map.put(((Number) r[0]).longValue(), ((Number) r[7]).longValue()));
        return map;
    }

    /** Resolve slug: nếu dto.slug null → generate từ name */
    private String resolveSlug(String slugInput, String name) {
        return (slugInput != null && !slugInput.isBlank())
                ? generateSlug(slugInput)
                : generateSlug(name);
    }

    /** Normalize → lowercase → replace spaces/specials → slug */
    private String generateSlug(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return Pattern.compile("\\p{InCombiningDiacriticalMarks}+")
                .matcher(normalized).replaceAll("")
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
    }

    private boolean toBool(Object raw) {
        if (raw == null) return false;
        if (raw instanceof Boolean b) return b;
        if (raw instanceof Number n)  return n.intValue() != 0;
        return Boolean.parseBoolean(raw.toString());
    }

    private String csvEsc(Object val) {
        if (val == null) return "";
        String s = val.toString().replace("\"", "\"\"");
        return s.contains(",") || s.contains("\n") ? "\"" + s + "\"" : s;
    }

    // ── POI helpers ───────────────────────────────────────────────────────
    private CellStyle buildHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        return style;
    }

    private CellStyle buildNumberStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        DataFormat fmt = wb.createDataFormat();
        style.setDataFormat(fmt.getFormat("#,##0"));
        return style;
    }

    private void createCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        if (style != null) cell.setCellStyle(style);
    }
}
