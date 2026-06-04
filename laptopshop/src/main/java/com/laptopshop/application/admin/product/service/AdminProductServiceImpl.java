package com.laptopshop.application.admin.product.service;

import com.laptopshop.application.admin.dashboard.dto.PageDto;
import com.laptopshop.application.admin.product.dto.*;
import com.laptopshop.domain.catalog.entity.*;
import com.laptopshop.domain.catalog.repository.*;
import com.laptopshop.domain.inventory.entity.StoreInventory;
import com.laptopshop.domain.inventory.repository.StoreInventoryRepository;
import com.laptopshop.domain.store.entity.Store;
import com.laptopshop.domain.store.repository.StoreRepository;
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
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminProductServiceImpl implements AdminProductService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductSpecRepository productSpecRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final StoreInventoryRepository storeInventoryRepository;
    private final StoreRepository storeRepository;

    // ── Resolve visible param ─────────────────────────────────────────────
    private Boolean resolveVisible(String status) {
        if (status == null || "all".equalsIgnoreCase(status)) return null;
        return "visible".equalsIgnoreCase(status);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 1. searchProducts
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public PageDto<ProductListDto> searchProducts(String q, Long brandId, Long categoryId,
                                                  String status, Pageable pageable) {
        String qParam = (q != null && !q.isBlank()) ? q.trim() : null;
        Boolean visible = resolveVisible(status);

        Page<Product> page = productRepository.searchWithFilters(
                qParam, brandId, categoryId, visible, pageable);

        // Batch load stock data tránh N+1
        List<Long> productIds = page.getContent().stream()
                .map(Product::getId).collect(Collectors.toList());

        Map<Long, Integer> stockMap    = new HashMap<>();
        Map<Long, Integer> minStockMap = new HashMap<>();
        if (!productIds.isEmpty()) {
            storeInventoryRepository.sumStockByProductIds(productIds)
                    .forEach(r -> stockMap.put(
                            ((Number) r[0]).longValue(), ((Number) r[1]).intValue()));
            storeInventoryRepository.minStockByProductIds(productIds)
                    .forEach(r -> minStockMap.put(
                            ((Number) r[0]).longValue(), ((Number) r[1]).intValue()));
        }

        List<ProductListDto> content = page.getContent().stream().map(p -> {
            // Primary image
            String imgUrl = p.getImages() == null ? null : p.getImages().stream()
                    .filter(i -> Boolean.TRUE.equals(i.getIsPrimary()))
                    .map(ProductImage::getImageUrl)
                    .findFirst().orElse(null);

            return new ProductListDto(
                    p.getId(),
                    p.getName(),
                    p.getSku(),
                    p.getBrand()    != null ? p.getBrand().getName()    : null,
                    p.getCategory() != null ? p.getCategory().getName() : null,
                    p.getBasePrice()  != null ? p.getBasePrice().longValue()  : null,
                    p.getSalePrice()  != null ? p.getSalePrice().longValue()  : null,
                    stockMap.getOrDefault(p.getId(), 0),
                    minStockMap.getOrDefault(p.getId(), 0),
                    p.getIsActive(),
                    imgUrl
            );
        }).collect(Collectors.toList());

        return PageDto.from(new PageImpl<>(content, pageable, page.getTotalElements()));
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. getProduct
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public ProductDetailDto getProduct(Long id) {
        Product p = productRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new NoSuchElementException("Sản phẩm không tồn tại: " + id));
        return toDetailDto(p);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 3. createProduct
    // ══════════════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public ProductDetailDto createProduct(CreateProductRequestDto dto) {
        // Validate SKU unique
        if (productRepository.existsBySku(dto.getSku()))
            throw new IllegalArgumentException("SKU đã tồn tại: " + dto.getSku());

        Brand brand = brandRepository.findById(dto.getBrandId())
                .orElseThrow(() -> new NoSuchElementException("Brand không tồn tại: " + dto.getBrandId()));
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new NoSuchElementException("Category không tồn tại: " + dto.getCategoryId()));

        // Create product
        Product p = new Product();
        p.setName(dto.getName());
        p.setSku(dto.getSku());
        p.setSlug(generateSlug(dto.getName(), dto.getSku()));
        p.setBrand(brand);
        p.setCategory(category);
        p.setDescription(dto.getDescription());
        p.setBasePrice(dto.getBasePrice());
        p.setSalePrice(dto.getSalePrice());
        p.setIsActive(Boolean.TRUE.equals(dto.getVisible()));
        Product saved = productRepository.save(p);

        // Create spec
        if (dto.getSpecs() != null) {
            saveSpec(saved, dto.getSpecs());
        }

        // Create images
        if (dto.getImageUrls() != null && !dto.getImageUrls().isEmpty()) {
            saveImages(saved, dto.getImageUrls());
        }

        // Init inventory for all active stores
        initInventory(saved, dto.getStock(), dto.getMinStock());

        return toDetailDto(productRepository.findByIdWithDetails(saved.getId()).orElseThrow());
    }

    // ══════════════════════════════════════════════════════════════════════
    // 4. updateProduct
    // ══════════════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public ProductDetailDto updateProduct(Long id, UpdateProductRequestDto dto) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Sản phẩm không tồn tại: " + id));

        if (dto.getName()        != null) p.setName(dto.getName());
        if (dto.getBrandId()     != null) {
            Brand b = brandRepository.findById(dto.getBrandId())
                    .orElseThrow(() -> new NoSuchElementException("Brand không tồn tại"));
            p.setBrand(b);
        }
        if (dto.getCategoryId()  != null) {
            Category c = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new NoSuchElementException("Category không tồn tại"));
            p.setCategory(c);
        }
        if (dto.getDescription() != null) p.setDescription(dto.getDescription());
        if (dto.getBasePrice()   != null) p.setBasePrice(dto.getBasePrice());
        if (dto.getSalePrice()   != null) p.setSalePrice(dto.getSalePrice());
        if (dto.getVisible()     != null) p.setIsActive(dto.getVisible());

        productRepository.save(p);

        // Update specs
        if (dto.getSpecs() != null) {
            saveSpec(p, dto.getSpecs());
        }

        // Replace images nếu có
        if (dto.getImageUrls() != null) {
            productImageRepository.deleteAllByProductId(id);
            saveImages(p, dto.getImageUrls());
        }

        // Update stock/minStock
        if (dto.getStock()    != null) {
            storeInventoryRepository.updateQuantityAllStores(id, dto.getStock());
        }
        if (dto.getMinStock() != null) {
            storeInventoryRepository.updateMinQuantityAllStores(id, dto.getMinStock());
        }

        return toDetailDto(productRepository.findByIdWithDetails(id).orElseThrow());
    }

    // ══════════════════════════════════════════════════════════════════════
    // 5. deleteProduct
    // ══════════════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id))
            throw new NoSuchElementException("Sản phẩm không tồn tại: " + id);
        productRepository.deleteById(id);
        log.info("Product {} deleted", id);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 6. setVisibility
    // ══════════════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public void setVisibility(Long id, boolean visible) {
        int updated = productRepository.updateVisibility(id, visible);
        if (updated == 0)
            throw new NoSuchElementException("Sản phẩm không tồn tại: " + id);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 7. getFiltersMeta
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public ProductFiltersMetaDto getFiltersMeta() {
        List<BrandDto> brands = brandRepository.findAllActive().stream()
                .map(b -> new BrandDto(b.getId(), b.getName(), b.getLogoUrl()))
                .collect(Collectors.toList());

        List<CategoryDto> categories = categoryRepository.findAllActive().stream()
                .map(c -> new CategoryDto(c.getId(), c.getName(),
                        c.getParent() != null ? c.getParent().getId() : null,
                        c.getSortOrder()))
                .collect(Collectors.toList());

        return new ProductFiltersMetaDto(brands, categories,
                List.of("visible", "hidden", "all"));
    }

    // ══════════════════════════════════════════════════════════════════════
    // 8. updateStock
    // ══════════════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public void updateStock(Long productId, Integer stock, Integer minStock) {
        if (!productRepository.existsById(productId))
            throw new NoSuchElementException("Sản phẩm không tồn tại: " + productId);
        if (stock    != null) storeInventoryRepository.updateQuantityAllStores(productId, stock);
        if (minStock != null) storeInventoryRepository.updateMinQuantityAllStores(productId, minStock);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 9. exportProducts — Apache POI
    // ══════════════════════════════════════════════════════════════════════
    @Override
    public byte[] exportProducts(ProductExportRequestDto req) {
        Boolean visible = resolveVisible(req.getStatus());
        List<Product> products = productRepository.findForExport(
                req.getQ(), req.getBrandId(), req.getCategoryId(), visible);

        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle hs = buildHeaderStyle(wb);
            CellStyle ns = buildNumberStyle(wb);

            if ("DETAILS".equalsIgnoreCase(req.getType())) {
                writeDetailsSheet(wb, products, hs, ns);
            } else {
                writeListSheet(wb, products, hs, ns);
            }

            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Product export failed", e);
            throw new RuntimeException("Không thể xuất danh sách sản phẩm", e);
        }
    }

    // ── Excel: List sheet ─────────────────────────────────────────────────
    private void writeListSheet(XSSFWorkbook wb, List<Product> products,
                                CellStyle hs, CellStyle ns) {
        Sheet sheet = wb.createSheet("Sản phẩm");
        String[] cols = {"ID", "Tên", "SKU", "Thương hiệu", "Danh mục",
                "Giá gốc (₫)", "Giá KM (₫)", "Hiển thị"};
        Row header = sheet.createRow(0);
        for (int c = 0; c < cols.length; c++) {
            createCell(header, c, cols[c], hs);
            sheet.setColumnWidth(c, 5000);
        }
        sheet.setColumnWidth(1, 8000);

        int i = 1;
        for (Product p : products) {
            Row row = sheet.createRow(i++);
            row.createCell(0).setCellValue(p.getId());
            createCell(row, 1, p.getName(), null);
            createCell(row, 2, p.getSku(), null);
            createCell(row, 3, p.getBrand()    != null ? p.getBrand().getName()    : "", null);
            createCell(row, 4, p.getCategory() != null ? p.getCategory().getName() : "", null);
            Cell bp = row.createCell(5);
            bp.setCellValue(p.getBasePrice() != null ? p.getBasePrice().doubleValue() : 0);
            bp.setCellStyle(ns);
            if (p.getSalePrice() != null) {
                Cell sp = row.createCell(6);
                sp.setCellValue(p.getSalePrice().doubleValue());
                sp.setCellStyle(ns);
            }
            createCell(row, 7, Boolean.TRUE.equals(p.getIsActive()) ? "Có" : "Không", null);
        }
    }

    // ── Excel: Details sheet (kèm specs) ─────────────────────────────────
    private void writeDetailsSheet(XSSFWorkbook wb, List<Product> products,
                                   CellStyle hs, CellStyle ns) {
        writeListSheet(wb, products, hs, ns); // sheet 1: basic list

        Sheet specSheet = wb.createSheet("Thông số kỹ thuật");
        String[] cols = {"ID", "Tên", "SKU", "CPU", "RAM", "Storage",
                "Display", "GPU", "OS", "Weight (kg)", "Battery (Wh)", "Ports", "Color"};
        Row header = specSheet.createRow(0);
        for (int c = 0; c < cols.length; c++) {
            createCell(header, c, cols[c], hs);
            specSheet.setColumnWidth(c, 4500);
        }

        int i = 1;
        for (Product p : products) {
            Row row = specSheet.createRow(i++);
            row.createCell(0).setCellValue(p.getId());
            createCell(row, 1, p.getName(), null);
            createCell(row, 2, p.getSku(), null);
            ProductSpec s = p.getSpec();
            if (s != null) {
                createCell(row, 3,  s.getCpu(), null);
                createCell(row, 4,  s.getRam(), null);
                createCell(row, 5,  s.getStorage(), null);
                createCell(row, 6,  s.getDisplay(), null);
                createCell(row, 7,  s.getGpu(), null);
                createCell(row, 8,  s.getOs(), null);
                if (s.getWeightKg()  != null) row.createCell(9).setCellValue(s.getWeightKg().doubleValue());
                if (s.getBatteryWh() != null) row.createCell(10).setCellValue(s.getBatteryWh());
                createCell(row, 11, s.getPorts(), null);
                createCell(row, 12, s.getColor(), null);
            }
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private ProductDetailDto toDetailDto(Product p) {
        int stock    = storeInventoryRepository.sumStockByProduct(p.getId());
        int minStock = storeInventoryRepository.minStockByProduct(p.getId());

        ProductSpecsDto specsDto = null;
        if (p.getSpec() != null) {
            ProductSpec s = p.getSpec();
            specsDto = new ProductSpecsDto(s.getCpu(), s.getRam(), s.getStorage(),
                    s.getDisplay(), s.getGpu(), s.getOs(),
                    s.getWeightKg(), s.getBatteryWh(), s.getPorts(), s.getColor());
        }

        List<ProductImageDto> imageDtos = p.getImages() == null ? List.of()
                : p.getImages().stream()
                .sorted(Comparator.comparing(ProductImage::getIsPrimary, Comparator.reverseOrder())
                        .thenComparingInt(ProductImage::getSortOrder))
                .map(i -> new ProductImageDto(i.getId(), i.getImageUrl(),
                        i.getAltText(), i.getIsPrimary(), i.getSortOrder()))
                .collect(Collectors.toList());

        return new ProductDetailDto(
                p.getId(), p.getName(), p.getSku(), p.getSlug(),
                p.getBrand()    != null ? p.getBrand().getId()    : null,
                p.getBrand()    != null ? p.getBrand().getName()  : null,
                p.getCategory() != null ? p.getCategory().getId() : null,
                p.getCategory() != null ? p.getCategory().getName() : null,
                p.getDescription(),
                p.getBasePrice()  != null ? p.getBasePrice().longValue()  : null,
                p.getSalePrice()  != null ? p.getSalePrice().longValue()  : null,
                stock, minStock,
                specsDto, imageDtos,
                p.getIsActive(),
                p.getCreatedAt(), p.getUpdatedAt()
        );
    }

    private void saveSpec(Product product, ProductSpecsDto dto) {
        ProductSpec spec = productSpecRepository.findByProductId(product.getId())
                .orElse(new ProductSpec());
        spec.setProduct(product);
        spec.setCpu(dto.getCpu());
        spec.setRam(dto.getRam());
        spec.setStorage(dto.getStorage());
        spec.setDisplay(dto.getDisplay());
        spec.setGpu(dto.getGpu());
        spec.setOs(dto.getOs());
        spec.setWeightKg(dto.getWeightKg());
        spec.setBatteryWh(dto.getBatteryWh());
        spec.setPorts(dto.getPorts());
        spec.setColor(dto.getColor());
        productSpecRepository.save(spec);
    }

    private void saveImages(Product product, List<String> imageUrls) {
        for (int idx = 0; idx < imageUrls.size(); idx++) {
            ProductImage img = new ProductImage();
            img.setProduct(product);
            img.setImageUrl(imageUrls.get(idx));
            img.setIsPrimary(idx == 0);
            img.setSortOrder(idx);
            productImageRepository.save(img);
        }
    }

    private void initInventory(Product product, Integer stock, Integer minStock) {
        List<Store> stores = storeRepository.findAllActive();
        for (Store store : stores) {
            StoreInventory inv = new StoreInventory();
            inv.setProduct(product);
            inv.setStore(store);
            inv.setQuantity(stock != null ? stock : 0);
            inv.setMinQuantity(minStock != null ? minStock : 5);
            storeInventoryRepository.save(inv);
        }
    }

    /** Sinh slug từ name + sku: "laptop-dell-xps-15-XPS15" */
    private String generateSlug(String name, String sku) {
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD);
        String slug = Pattern.compile("\\p{InCombiningDiacriticalMarks}+")
                .matcher(normalized).replaceAll("")
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
        return slug + "-" + sku.toLowerCase();
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
