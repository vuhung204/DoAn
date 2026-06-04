package com.laptopshop.application.admin.inventory.service;

import com.laptopshop.application.admin.inventory.dto.ExportRequestDto;
import com.laptopshop.application.admin.inventory.dto.PageDto;
import com.laptopshop.application.admin.inventory.dto.*;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface AdminInventoryService {

    /** Tổng quan tồn kho tất cả chi nhánh. */
    InventoryOverviewDto getOverview();

    /** Danh sách tóm tắt tồn kho theo chi nhánh. */
    List<BranchInventoryDto> listBranches();

    /** Danh sách sản phẩm kèm tồn kho, hỗ trợ filter + phân trang. */
    PageDto<ProductInventoryDto> listProducts(Long branchId, String q,
                                              boolean lowStockOnly, Pageable pageable);

    /** Lịch sử giao dịch tồn kho của một sản phẩm. */
    PageDto<InventoryHistoryDto> getProductHistory(Long productId, Long branchId,
                                                   LocalDateTime from, LocalDateTime to,
                                                   Pageable pageable);

    // ── Phiếu nhập ──────────────────────────────────────────────────────────

    PageDto<ImportTicketDto> listImports(Long branchId, String status,
                                         LocalDateTime from, LocalDateTime to,
                                         Pageable pageable);

    ImportTicketDto getImport(Long ticketId);

    /** Tạo phiếu nhập: tăng stock + ghi InventoryTransaction. */
    ImportTicketDto createImport(CreateImportRequestDto req);

    // ── Phiếu xuất ──────────────────────────────────────────────────────────

    PageDto<ExportTicketDto> listExports(Long branchId, String status,
                                         LocalDateTime from, LocalDateTime to,
                                         Pageable pageable);

    ExportTicketDto getExport(Long ticketId);

    /** Tạo phiếu xuất: giảm stock (validate đủ hàng) + ghi transaction. */
    ExportTicketDto createExport(CreateExportRequestDto req);

    // ── Phiếu chuyển kho ────────────────────────────────────────────────────

    PageDto<TransferTicketDto> listTransfers(Long fromBranchId, Long toBranchId,
                                             String status,
                                             LocalDateTime from, LocalDateTime to,
                                             Pageable pageable);

    TransferTicketDto getTransfer(Long ticketId);

    /** Tạo phiếu chuyển kho: giảm nguồn, tăng đích + 2 transaction rows. */
    TransferTicketDto createTransfer(CreateTransferRequestDto req);

    // ── Điều chỉnh thủ công ─────────────────────────────────────────────────

    /** Tăng/giảm stock thủ công + ghi ADJUSTMENT transaction. */
    void adjustStock(AdjustStockRequestDto req);

    // ── Cảnh báo ─────────────────────────────────────────────────────────────

    List<InventoryAlertDto> listAlerts(String severity, Long branchId);

    // ── Export ───────────────────────────────────────────────────────────────

    /** Xuất XLSX: type = PRODUCTS | IMPORTS | EXPORTS | TRANSFERS | ALERTS */
    byte[] exportInventory(ExportRequestDto req);
}
