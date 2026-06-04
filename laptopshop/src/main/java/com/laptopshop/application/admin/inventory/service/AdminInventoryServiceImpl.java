package com.laptopshop.application.admin.inventory.service;

import com.laptopshop.application.admin.inventory.dto.*;
import com.laptopshop.application.admin.inventory.dto.ExportRequestDto;
import com.laptopshop.application.admin.inventory.dto.PageDto;
import com.laptopshop.domain.catalog.entity.Product;
import com.laptopshop.domain.inventory.entity.*;
import com.laptopshop.domain.inventory.enums.InventoryTicketStatus;
import com.laptopshop.domain.inventory.enums.InventoryTicketType;
import com.laptopshop.domain.inventory.enums.InventoryTransactionType;
import com.laptopshop.domain.inventory.repository.*;
import com.laptopshop.domain.store.entity.Staff;
import com.laptopshop.domain.store.entity.Store;
import com.laptopshop.infrastructure.security.StoreAccessGuard;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminInventoryServiceImpl implements AdminInventoryService {

    private final StoreInventoryRepository       storeInventoryRepo;
    private final InventoryTicketRepository      ticketRepo;
    private final InventoryTransactionRepository txnRepo;
    private final InventoryAlertRepository       alertRepo;
    private final StoreAccessGuard storeAccessGuard;

    // ── OVERVIEW ─────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public InventoryOverviewDto getOverview() {
        List<BranchInventoryDto> branches = listBranches();
        int totalProducts  = branches.stream().mapToInt(BranchInventoryDto::getProductCount).max().orElse(0);
        int totalQuantity  = branches.stream().mapToInt(BranchInventoryDto::getTotalQuantity).sum();
        int totalLowStock  = branches.stream().mapToInt(BranchInventoryDto::getLowStockCount).sum();
        BigDecimal totalValue = branches.stream()
                .map(BranchInventoryDto::getInventoryValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new InventoryOverviewDto(branches, totalProducts, totalQuantity, totalLowStock, totalValue);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BranchInventoryDto> listBranches() {
        List<Object[]> rows = storeInventoryRepo.aggregateByBranch(null);
        return rows.stream().map(r -> new BranchInventoryDto(
                ((Number) r[0]).longValue(),
                (String) r[1],
                ((Number) r[2]).intValue(),
                ((Number) r[3]).intValue(),
                ((Number) r[4]).intValue(),
                r[5] != null ? new BigDecimal(r[5].toString()) : BigDecimal.ZERO
        )).collect(Collectors.toList());
    }

    // ── PRODUCTS LIST ────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageDto<ProductInventoryDto> listProducts(Long branchId, String q,
                                                     boolean lowStockOnly, Pageable pageable) {
        int offset      = (int) pageable.getOffset();
        int limit       = pageable.getPageSize();
        int lowStockInt = lowStockOnly ? 1 : 0;
        String qNull    = blankToNull(q);

        List<Object[]> rows  = storeInventoryRepo.findProductsWithStock(branchId, qNull, lowStockInt, limit, offset);
        long total           = storeInventoryRepo.countProductsWithStock(branchId, qNull, lowStockInt);

        List<ProductInventoryDto> content = rows.stream().map(r -> {
            Long productId = ((Number) r[0]).longValue();
            Map<Long, Integer> stockByBranch = new LinkedHashMap<>();
            storeInventoryRepo.findStockByBranch(productId)
                    .forEach(sb -> stockByBranch.put(
                            ((Number) sb[0]).longValue(),
                            ((Number) sb[1]).intValue()));

            return new ProductInventoryDto(
                    productId,
                    (String) r[1],
                    (String) r[2],
                    stockByBranch,
                    ((Number) r[3]).intValue(),
                    ((Number) r[4]).intValue(),
                    ((Number) r[6]).intValue() == 1,
                    r[5] != null ? new BigDecimal(r[5].toString()) : BigDecimal.ZERO
            );
        }).collect(Collectors.toList());

        Page<ProductInventoryDto> page = new PageImpl<>(content, pageable, total);
        return PageDto.of(page);
    }

    // ── HISTORY ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageDto<InventoryHistoryDto> getProductHistory(Long productId, Long branchId,
                                                          LocalDateTime from, LocalDateTime to,
                                                          Pageable pageable) {
        Page<InventoryTransaction> page = txnRepo.findHistory(productId, branchId, from, to, pageable);
        return PageDto.of(page.map(this::toHistoryDto));
    }

    // ── IMPORTS ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageDto<ImportTicketDto> listImports(Long branchId, String status,
                                                LocalDateTime from, LocalDateTime to,
                                                Pageable pageable) {
        Page<InventoryTicket> page = ticketRepo.findByTypeAndFilters(
                InventoryTicketType.IMPORT, branchId, status, from, to, pageable);
        return PageDto.of(page.map(t -> toImportDto(t)));
    }

    @Override
    @Transactional(readOnly = true)
    public ImportTicketDto getImport(Long ticketId) {
        InventoryTicket t = ticketRepo.findDetailById(ticketId)
                .orElseThrow(() -> notFound("Phiếu nhập", ticketId));
        return toImportDto(t);
    }

    @Override
    @Transactional
    public ImportTicketDto createImport(CreateImportRequestDto req) {
        // [PATCH] Staff chỉ được nhập kho cho chi nhánh mình
        storeAccessGuard.assertCanAccessStore(req.getCreatedBy(), req.getBranchId());

        InventoryTicket ticket = buildTicket(InventoryTicketType.IMPORT, req.getCreatedBy());
        ticket.setToStore(storeRef(req.getBranchId()));
        ticket.setSupplier(req.getSupplier());
        ticket.setNote(req.getNote());

        for (InventoryTicketLineDto line : req.getLines()) {
            validateLineQty(line);
            addLine(ticket, line);
            storeInventoryRepo.upsertQuantity(req.getBranchId(), line.getProductId(), line.getQty());
            saveTxn(req.getBranchId(), line.getProductId(), line.getQty(),
                    InventoryTransactionType.IMPORT, req.getCreatedBy(),
                    null, "Nhập kho theo phiếu");
        }

        refreshAlert(req.getBranchId(), req.getLines());
        ticket.setProcessedAt(LocalDateTime.now());
        return toImportDto(ticketRepo.save(ticket));
    }

    // ── EXPORTS ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageDto<ExportTicketDto> listExports(Long branchId, String status,
                                                LocalDateTime from, LocalDateTime to,
                                                Pageable pageable) {
        Page<InventoryTicket> page = ticketRepo.findByTypeAndFilters(
                InventoryTicketType.EXPORT, branchId, status, from, to, pageable);
        return PageDto.of(page.map(t -> toExportDto(t)));
    }

    @Override
    @Transactional(readOnly = true)
    public ExportTicketDto getExport(Long ticketId) {
        InventoryTicket t = ticketRepo.findDetailById(ticketId)
                .orElseThrow(() -> notFound("Phiếu xuất", ticketId));
        return toExportDto(t);
    }

    @Override
    @Transactional
    public ExportTicketDto createExport(CreateExportRequestDto req) {
        // [PATCH] Staff chỉ được xuất kho từ chi nhánh mình
        storeAccessGuard.assertCanAccessStore(req.getCreatedBy(), req.getBranchId());

        InventoryTicket ticket = buildTicket(InventoryTicketType.EXPORT, req.getCreatedBy());
        ticket.setFromStore(storeRef(req.getBranchId()));
        ticket.setReason(req.getReason());
        ticket.setNote(req.getNote());

        for (InventoryTicketLineDto line : req.getLines()) {
            validateLineQty(line);
            int updated = storeInventoryRepo.adjustQuantity(
                    req.getBranchId(), line.getProductId(), -line.getQty());
            if (updated == 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Không đủ tồn kho cho sản phẩm ID=" + line.getProductId());
            }
            addLine(ticket, line);
            saveTxn(req.getBranchId(), line.getProductId(), -line.getQty(),
                    InventoryTransactionType.EXPORT, req.getCreatedBy(),
                    null, req.getReason());
        }

        refreshAlert(req.getBranchId(), req.getLines());
        ticket.setProcessedAt(LocalDateTime.now());
        return toExportDto(ticketRepo.save(ticket));
    }

    // ── TRANSFERS ────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageDto<TransferTicketDto> listTransfers(Long fromBranchId, Long toBranchId,
                                                    String status,
                                                    LocalDateTime from, LocalDateTime to,
                                                    Pageable pageable) {
        Long storeFilter = fromBranchId != null ? fromBranchId : toBranchId;
        Page<InventoryTicket> page = ticketRepo.findByTypeAndFilters(
                InventoryTicketType.TRANSFER, storeFilter, status, from, to, pageable);
        return PageDto.of(page.map(t -> toTransferDto(t)));
    }

    @Override
    @Transactional(readOnly = true)
    public TransferTicketDto getTransfer(Long ticketId) {
        InventoryTicket t = ticketRepo.findDetailById(ticketId)
                .orElseThrow(() -> notFound("Phiếu chuyển kho", ticketId));
        return toTransferDto(t);
    }

    @Override
    @Transactional
    public TransferTicketDto createTransfer(CreateTransferRequestDto req) {
        if (req.getFromBranchId().equals(req.getToBranchId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chi nhánh nguồn và đích không được trùng nhau");
        }

        // [PATCH] Staff chỉ được tạo phiếu chuyển từ chi nhánh mình
        // Chi nhánh đích không giới hạn (có thể chuyển sang bất kỳ chi nhánh nào)
        storeAccessGuard.assertCanAccessStore(req.getCreatedBy(), req.getFromBranchId());

        InventoryTicket ticket = buildTicket(InventoryTicketType.TRANSFER, req.getCreatedBy());
        ticket.setFromStore(storeRef(req.getFromBranchId()));
        ticket.setToStore(storeRef(req.getToBranchId()));
        ticket.setReason(req.getReason());
        ticket.setNote(req.getNote());

        String batchRef = UUID.randomUUID().toString();

        for (InventoryTicketLineDto line : req.getLines()) {
            validateLineQty(line);
            int updated = storeInventoryRepo.adjustQuantity(
                    req.getFromBranchId(), line.getProductId(), -line.getQty());
            if (updated == 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Không đủ tồn kho tại chi nhánh nguồn cho sản phẩm ID=" + line.getProductId());
            }
            storeInventoryRepo.upsertQuantity(req.getToBranchId(), line.getProductId(), line.getQty());

            addLine(ticket, line);

            saveTxnWithBatch(req.getFromBranchId(), line.getProductId(), -line.getQty(),
                    InventoryTransactionType.TRANSFER_OUT, req.getCreatedBy(), batchRef,
                    "Chuyển sang chi nhánh ID=" + req.getToBranchId());
            saveTxnWithBatch(req.getToBranchId(), line.getProductId(), line.getQty(),
                    InventoryTransactionType.TRANSFER_IN, req.getCreatedBy(), batchRef,
                    "Nhận từ chi nhánh ID=" + req.getFromBranchId());
        }

        refreshAlert(req.getFromBranchId(), req.getLines());
        ticket.setProcessedAt(LocalDateTime.now());
        return toTransferDto(ticketRepo.save(ticket));
    }

    // ── ADJUST ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void adjustStock(AdjustStockRequestDto req) {
        if (req.getDelta() == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delta không được bằng 0");
        }

        // [PATCH] Staff chỉ được điều chỉnh tồn kho chi nhánh mình
        storeAccessGuard.assertCanAccessStore(req.getStaffId(), req.getBranchId());

        int updated = storeInventoryRepo.adjustQuantity(
                req.getBranchId(), req.getProductId(), req.getDelta());
        if (updated == 0 && req.getDelta() < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Không đủ tồn kho để điều chỉnh âm cho sản phẩm ID=" + req.getProductId());
        }

        saveTxn(req.getBranchId(), req.getProductId(), req.getDelta(),
                InventoryTransactionType.ADJUSTMENT, req.getStaffId(),
                null, req.getReason());

        storeInventoryRepo.findByStore_IdAndProduct_Id(req.getBranchId(), req.getProductId())
                .ifPresent(si -> updateAlert(req.getBranchId(), req.getProductId(),
                        si.getQuantity(), si.getMinQuantity()));
    }

    // ── ALERTS ───────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<InventoryAlertDto> listAlerts(String severity, Long branchId) {
        return alertRepo.findActiveAlerts(branchId, blankToNull(severity))
                .stream().map(a -> new InventoryAlertDto(
                        a.getProduct().getId(),
                        a.getProduct().getSku(),
                        a.getProduct().getName(),
                        a.getStore().getId(),
                        a.getStore().getName(),
                        a.getStock(),
                        a.getMinStock(),
                        a.getSeverity(),
                        a.getNote()
                )).collect(Collectors.toList());
    }

    // ── EXPORT XLSX ──────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public byte[] exportInventory(ExportRequestDto req) {
        String type = req.getExportType() != null ? req.getExportType().toUpperCase() : "PRODUCTS";

        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle headerStyle = buildHeaderStyle(wb);

            switch (type) {
                case "PRODUCTS"  -> writeProductsSheet(wb, headerStyle, req);
                case "IMPORTS"   -> writeTicketsSheet(wb, headerStyle, req, InventoryTicketType.IMPORT, "Nhập kho");
                case "EXPORTS"   -> writeTicketsSheet(wb, headerStyle, req, InventoryTicketType.EXPORT, "Xuất kho");
                case "TRANSFERS" -> writeTicketsSheet(wb, headerStyle, req, InventoryTicketType.TRANSFER, "Chuyển kho");
                case "ALERTS"    -> writeAlertsSheet(wb, headerStyle, req);
                default          -> writeProductsSheet(wb, headerStyle, req);
            }

            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi xuất XLSX: " + e.getMessage(), e);
        }
    }

    // ── PRIVATE: XLSX writers ────────────────────────────────────────────────

    private void writeProductsSheet(XSSFWorkbook wb, CellStyle hs, ExportRequestDto req) {
        Sheet sheet = wb.createSheet("Tồn kho sản phẩm");
        String[] headers = {"Product ID", "SKU", "Tên sản phẩm",
                "Tổng tồn kho", "Tồn tối thiểu", "Cảnh báo", "Giá trị ước tính"};
        writeHeaderRow(sheet, hs, headers);

        List<Object[]> rows = storeInventoryRepo.findProductsWithStock(
                req.getStoreId(), blankToNull(req.getQ()), 0, Integer.MAX_VALUE, 0);
        for (int i = 0; i < rows.size(); i++) {
            Object[] r = rows.get(i);
            Row row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue(((Number) r[0]).longValue());
            row.createCell(1).setCellValue((String) r[1]);
            row.createCell(2).setCellValue((String) r[2]);
            row.createCell(3).setCellValue(((Number) r[3]).intValue());
            row.createCell(4).setCellValue(((Number) r[4]).intValue());
            row.createCell(5).setCellValue(((Number) r[6]).intValue() == 1 ? "Thấp" : "OK");
            row.createCell(6).setCellValue(r[5] != null
                    ? new BigDecimal(r[5].toString()).doubleValue() : 0);
        }
        for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
    }

    private void writeTicketsSheet(XSSFWorkbook wb, CellStyle hs,
                                   ExportRequestDto req,
                                   InventoryTicketType type, String sheetName) {
        Sheet sheet = wb.createSheet(sheetName);
        String[] headers = {"Ticket ID", "Từ chi nhánh", "Đến chi nhánh",
                "Nhà cung cấp/Lý do", "Trạng thái", "Ngày tạo", "Ngày xử lý"};
        writeHeaderRow(sheet, hs, headers);

        List<InventoryTicket> tickets = ticketRepo.findForExport(
                type, req.getStoreId(), req.getFromDate(), req.getToDate());
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        for (int i = 0; i < tickets.size(); i++) {
            InventoryTicket t = tickets.get(i);
            Row row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue(t.getId());
            row.createCell(1).setCellValue(t.getFromStore() != null ? t.getFromStore().getName() : "");
            row.createCell(2).setCellValue(t.getToStore() != null ? t.getToStore().getName() : "");
            row.createCell(3).setCellValue(t.getSupplier() != null ? t.getSupplier()
                    : (t.getReason() != null ? t.getReason() : ""));
            row.createCell(4).setCellValue(t.getStatus().name());
            row.createCell(5).setCellValue(t.getCreatedAt() != null ? t.getCreatedAt().format(dtf) : "");
            row.createCell(6).setCellValue(t.getProcessedAt() != null ? t.getProcessedAt().format(dtf) : "");
        }
        for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
    }

    private void writeAlertsSheet(XSSFWorkbook wb, CellStyle hs, ExportRequestDto req) {
        Sheet sheet = wb.createSheet("Cảnh báo tồn kho");
        String[] headers = {"Product ID", "SKU", "Tên", "Chi nhánh",
                "Tồn kho", "Tối thiểu", "Mức độ", "Ghi chú"};
        writeHeaderRow(sheet, hs, headers);

        List<InventoryAlert> alerts = alertRepo.findActiveAlerts(req.getStoreId(), null);
        for (int i = 0; i < alerts.size(); i++) {
            InventoryAlert a = alerts.get(i);
            Row row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue(a.getProduct().getId());
            row.createCell(1).setCellValue(a.getProduct().getSku());
            row.createCell(2).setCellValue(a.getProduct().getName());
            row.createCell(3).setCellValue(a.getStore().getName());
            row.createCell(4).setCellValue(a.getStock());
            row.createCell(5).setCellValue(a.getMinStock());
            row.createCell(6).setCellValue(a.getSeverity());
            row.createCell(7).setCellValue(a.getNote() != null ? a.getNote() : "");
        }
        for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
    }

    // ── PRIVATE: mapping helpers ─────────────────────────────────────────────

    private ImportTicketDto toImportDto(InventoryTicket t) {
        return new ImportTicketDto(
                t.getId(),
                t.getToStore() != null ? t.getToStore().getId() : null,
                t.getToStore() != null ? t.getToStore().getName() : null,
                t.getSupplier(),
                toLineDtos(t),
                t.getStatus().name(),
                t.getCreatedAt(),
                t.getProcessedAt(),
                t.getCreatedBy() != null ? t.getCreatedBy().getId() : null
        );
    }

    private ExportTicketDto toExportDto(InventoryTicket t) {
        return new ExportTicketDto(
                t.getId(),
                t.getFromStore() != null ? t.getFromStore().getId() : null,
                t.getFromStore() != null ? t.getFromStore().getName() : null,
                t.getReason(),
                toLineDtos(t),
                t.getStatus().name(),
                t.getCreatedAt(),
                t.getProcessedAt(),
                t.getCreatedBy() != null ? t.getCreatedBy().getId() : null
        );
    }

    private TransferTicketDto toTransferDto(InventoryTicket t) {
        return new TransferTicketDto(
                t.getId(),
                t.getFromStore() != null ? t.getFromStore().getId() : null,
                t.getFromStore() != null ? t.getFromStore().getName() : null,
                t.getToStore()   != null ? t.getToStore().getId() : null,
                t.getToStore()   != null ? t.getToStore().getName() : null,
                t.getReason(),
                toLineDtos(t),
                t.getStatus().name(),
                t.getCreatedAt(),
                t.getProcessedAt(),
                t.getCreatedBy() != null ? t.getCreatedBy().getId() : null
        );
    }

    private List<InventoryTicketLineDto> toLineDtos(InventoryTicket t) {
        if (t.getLines() == null) return List.of();
        return t.getLines().stream().map(l -> new InventoryTicketLineDto(
                l.getProduct() != null ? l.getProduct().getId() : null,
                l.getProduct() != null ? l.getProduct().getSku() : null,
                l.getProduct() != null ? l.getProduct().getName() : null,
                l.getQuantity(),
                l.getUnitPrice(),
                l.getLineTotal()
        )).collect(Collectors.toList());
    }

    private InventoryHistoryDto toHistoryDto(InventoryTransaction t) {
        return new InventoryHistoryDto(
                t.getId(),
                t.getProduct() != null ? t.getProduct().getId() : null,
                t.getStore()   != null ? t.getStore().getId() : null,
                t.getQuantityDelta(),
                t.getTransactionType().name(),
                t.getBatchRef(),
                t.getCreatedAt(),
                t.getStaff() != null ? t.getStaff().getId() : null,
                t.getNote()
        );
    }

    // ── PRIVATE: stock + alert helpers ──────────────────────────────────────

    private void refreshAlert(Long storeId, List<InventoryTicketLineDto> lines) {
        for (InventoryTicketLineDto line : lines) {
            storeInventoryRepo.findByStore_IdAndProduct_Id(storeId, line.getProductId())
                    .ifPresent(si -> updateAlert(storeId, line.getProductId(),
                            si.getQuantity(), si.getMinQuantity()));
        }
    }

    private void updateAlert(Long storeId, Long productId, int stock, int minStock) {
        if (stock > minStock) {
            alertRepo.resolveAlert(storeId, productId);
        } else {
            String severity = computeSeverity(stock, minStock);
            alertRepo.upsertAlert(storeId, productId, stock, minStock, severity, null);
        }
    }

    private String computeSeverity(int stock, int minStock) {
        if (stock == 0) return "critical";
        if (stock <= minStock / 2) return "warning";
        return "info";
    }

    private void saveTxn(Long storeId, Long productId, int delta,
                         InventoryTransactionType type, Long staffId,
                         String batchRef, String note) {
        saveTxnWithBatch(storeId, productId, delta, type, staffId, batchRef, note);
    }

    private void saveTxnWithBatch(Long storeId, Long productId, int delta,
                                  InventoryTransactionType type, Long staffId,
                                  String batchRef, String note) {
        InventoryTransaction txn = new InventoryTransaction();
        Store s = new Store(); s.setId(storeId);
        txn.setStore(s);
        Product p = new Product(); p.setId(productId);
        txn.setProduct(p);
        txn.setQuantityDelta(delta);
        txn.setTransactionType(type);
        txn.setBatchRef(batchRef);
        txn.setNote(note);
        if (staffId != null) {
            Staff st = new Staff(); st.setId(staffId);
            txn.setStaff(st);
        }
        txnRepo.save(txn);
    }

    private InventoryTicket buildTicket(InventoryTicketType type, Long staffId) {
        InventoryTicket t = new InventoryTicket();
        t.setTicketType(type);
        t.setStatus(InventoryTicketStatus.COMPLETED);
        if (staffId != null) {
            Staff s = new Staff(); s.setId(staffId);
            t.setCreatedBy(s);
        }
        return t;
    }

    private void addLine(InventoryTicket ticket, InventoryTicketLineDto dto) {
        InventoryTicketLine line = new InventoryTicketLine();
        line.setTicket(ticket);
        Product p = new Product(); p.setId(dto.getProductId());
        line.setProduct(p);
        line.setQuantity(dto.getQty());
        line.setUnitPrice(dto.getUnitPrice());
        if (dto.getUnitPrice() != null) {
            line.setLineTotal(dto.getUnitPrice().multiply(BigDecimal.valueOf(dto.getQty())));
        }
        ticket.getLines().add(line);
    }

    private Store storeRef(Long storeId) {
        Store s = new Store();
        s.setId(storeId);
        return s;
    }

    private void validateLineQty(InventoryTicketLineDto line) {
        if (line.getQty() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Số lượng phải > 0 cho sản phẩm ID=" + line.getProductId());
        }
    }

    private ResponseStatusException notFound(String entity, Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND,
                entity + " #" + id + " không tồn tại");
    }

    private void writeHeaderRow(Sheet sheet, CellStyle hs, String[] headers) {
        Row row = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell c = row.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(hs);
        }
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

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}