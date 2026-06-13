import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchOverview,
  fetchBranches,
  fetchProducts,
  fetchImports,
  fetchExports,
  fetchTransfers,
  fetchAlerts,
  adjustStock,
  createImport,
  createExport,
  createTransfer,
  exportInventory,
  syncAlerts,
  type InventoryOverviewDto,
  type BranchInventoryDto,
  type ProductInventoryDto,
  type ImportTicketDto,
  type ExportTicketDto,
  type TransferTicketDto,
  type InventoryAlertDto,
  type PageDto,
  type CreateImportBody,
  type CreateExportBody,
  type CreateTransferBody,
  type AdjustStockBody,
} from '../api/inventoryApi';

// ── Hook ─────────────────────────────────────────────────────────────────

export function useInventory() {
  // ── Overview / branches
  const [overview, setOverview]         = useState<InventoryOverviewDto | null>(null);
  const [overviewLoading, setOvLoading] = useState(false);

  // ── Products
  const [products, setProducts]         = useState<PageDto<ProductInventoryDto> | null>(null);
  const [productPage, setProductPage]   = useState(0);
  const [productQ, setProductQ]         = useState('');
  const [branchFilter, setBranchFilter] = useState<number | undefined>(undefined);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [productsLoading, setProdsLoading] = useState(false);

  // ── Imports
  const [imports, setImports]           = useState<PageDto<ImportTicketDto> | null>(null);
  const [importPage, setImportPage]     = useState(0);
  const [importsLoading, setImpLoading] = useState(false);

  // ── Exports
  const [exports, setExports]           = useState<PageDto<ExportTicketDto> | null>(null);
  const [exportPage, setExportPage]     = useState(0);
  const [exportsLoading, setExpLoading] = useState(false);

  // ── Transfers
  const [transfers, setTransfers]       = useState<PageDto<TransferTicketDto> | null>(null);
  const [transferPage, setTransferPage] = useState(0);
  const [transfersLoading, setTrfLoading] = useState(false);

  // ── Alerts
  const [alerts, setAlerts]             = useState<InventoryAlertDto[]>([]);
  const [alertsLoading, setAltLoading]  = useState(false);
  const [alertSeverity, setAlertSeverity] = useState<string | undefined>(undefined);

  // ── Action
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState<string | null>(null);

  // ── Toast
  const [toast, setToast]   = useState<string | null>(null);
  const toastRef            = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PAGE_SIZE = 10;

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadOverview = useCallback(async () => {
    setOvLoading(true);
    try {
      const data = await fetchOverview();
      setOverview(data);
    } catch { /* fail silently */ }
    finally { setOvLoading(false); }
  }, []);

  const loadProducts = useCallback(async () => {
    setProdsLoading(true);
    try {
      const data = await fetchProducts({
        page: productPage, size: PAGE_SIZE,
        branchId: branchFilter,
        q: productQ || undefined,
        lowStockOnly,
      });
      setProducts(data);
    } catch { /* fail silently */ }
    finally { setProdsLoading(false); }
  }, [productPage, branchFilter, productQ, lowStockOnly]);

  const loadImports = useCallback(async () => {
    setImpLoading(true);
    try {
      const data = await fetchImports({ page: importPage, size: PAGE_SIZE });
      setImports(data);
    } catch { /* fail silently */ }
    finally { setImpLoading(false); }
  }, [importPage]);

  const loadExports = useCallback(async () => {
    setExpLoading(true);
    try {
      const data = await fetchExports({ page: exportPage, size: PAGE_SIZE });
      setExports(data);
    } catch { /* fail silently */ }
    finally { setExpLoading(false); }
  }, [exportPage]);

  const loadTransfers = useCallback(async () => {
    setTrfLoading(true);
    try {
      const data = await fetchTransfers({ page: transferPage, size: PAGE_SIZE });
      setTransfers(data);
    } catch { /* fail silently */ }
    finally { setTrfLoading(false); }
  }, [transferPage]);

  // ── loadAlerts: chỉ fetch, không sync — dùng nội bộ sau các action ──────
  const loadAlerts = useCallback(async () => {
    setAltLoading(true);
    try {
      const data = await fetchAlerts({ severity: alertSeverity });
      setAlerts(data);
    } catch { /* fail silently */ }
    finally { setAltLoading(false); }
  }, [alertSeverity]);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { loadImports();  }, [loadImports]);
  useEffect(() => { loadExports();  }, [loadExports]);
  useEffect(() => { loadTransfers();}, [loadTransfers]);

  // ── Alerts: sync trước rồi fetch — tách try/catch để fetch luôn chạy dù sync lỗi
  useEffect(() => {
    const run = async () => {
      setAltLoading(true);
      try {
        await syncAlerts();
      } catch { /* sync thất bại không sao, vẫn tiếp tục fetch */ }
      try {
        const data = await fetchAlerts({ severity: alertSeverity });
        setAlerts(data);
      } catch { /* fail silently */ }
      finally { setAltLoading(false); }
    };
    run();
  }, [alertSeverity]); // chạy lại khi đổi filter severity

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleCreateImport = useCallback(async (body: CreateImportBody) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await createImport(body);
      showToast('✅ Tạo phiếu nhập thành công');
      loadImports();
      loadOverview();
    } catch (e) {
      const msg = extractMsg(e);
      setActionError(msg);
      showToast('❌ ' + msg);
    } finally { setActionLoading(false); }
  }, [loadImports, loadOverview]);

  const handleCreateExport = useCallback(async (body: CreateExportBody) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await createExport(body);
      showToast('✅ Tạo phiếu xuất thành công');
      loadExports();
      loadOverview();
    } catch (e) {
      const msg = extractMsg(e);
      setActionError(msg);
      showToast('❌ ' + msg);
    } finally { setActionLoading(false); }
  }, [loadExports, loadOverview]);

  const handleCreateTransfer = useCallback(async (body: CreateTransferBody) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await createTransfer(body);
      showToast('✅ Tạo phiếu chuyển kho thành công');
      loadTransfers();
      loadOverview();
    } catch (e) {
      const msg = extractMsg(e);
      setActionError(msg);
      showToast('❌ ' + msg);
    } finally { setActionLoading(false); }
  }, [loadTransfers, loadOverview]);

  const handleAdjustStock = useCallback(async (body: AdjustStockBody) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await adjustStock(body);
      showToast('✅ Điều chỉnh tồn kho thành công');
      loadProducts();
      loadAlerts();
      loadOverview();
    } catch (e) {
      const msg = extractMsg(e);
      setActionError(msg);
      showToast('❌ ' + msg);
    } finally { setActionLoading(false); }
  }, [loadProducts, loadAlerts, loadOverview]);

  const handleSyncAlerts = useCallback(async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await syncAlerts();
      await loadAlerts();
      await loadOverview();
      showToast('✅ Đã đồng bộ cảnh báo tồn kho');
    } catch (e) {
      const msg = extractMsg(e);
      setActionError(msg);
      showToast('❌ ' + msg);
    } finally { setActionLoading(false); }
  }, [loadAlerts, loadOverview]);

  const handleExport = useCallback(async (
    type: 'PRODUCTS' | 'IMPORTS' | 'EXPORTS' | 'TRANSFERS' | 'ALERTS',
  ) => {
    try {
      await exportInventory({ exportType: type });
      showToast('📥 Đang tải file xuất');
    } catch (e) {
      showToast('❌ Xuất file thất bại: ' + extractMsg(e));
    }
  }, []);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), 2800);
  };

  return {
    // overview
    overview, overviewLoading,
    branches: overview?.branches ?? [],

    // products
    products:       products?.content        ?? [],
    productTotal:   products?.totalElements  ?? 0,
    productPages:   products?.totalPages     ?? 0,
    productPage,    setProductPage,
    productQ,       setProductQ,
    branchFilter,   setBranchFilter,
    lowStockOnly,   setLowStockOnly,
    productsLoading,

    // imports
    imports:        imports?.content         ?? [],
    importTotal:    imports?.totalElements   ?? 0,
    importPages:    imports?.totalPages      ?? 0,
    importPage,     setImportPage,
    importsLoading,

    // exports
    exports:        exports?.content         ?? [],
    exportTotal:    exports?.totalElements   ?? 0,
    exportPages:    exports?.totalPages      ?? 0,
    exportPage,     setExportPage,
    exportsLoading,

    // transfers
    transfers:      transfers?.content       ?? [],
    transferTotal:  transfers?.totalElements ?? 0,
    transferPages:  transfers?.totalPages    ?? 0,
    transferPage,   setTransferPage,
    transfersLoading,

    // alerts
    alerts, alertsLoading,
    alertSeverity,  setAlertSeverity,

    // actions
    handleCreateImport,
    handleCreateExport,
    handleCreateTransfer,
    handleAdjustStock,
    handleExport,
    handleSyncAlerts,
    actionLoading,
    actionError,

    // refresh
    refresh: () => {
      loadOverview();
      loadProducts();
      loadImports();
      loadExports();
      loadTransfers();
      loadAlerts();
    },

    toast,
  };
}

// ── Util ─────────────────────────────────────────────────────────────────

function extractMsg(e: unknown): string {
  if (e && typeof e === 'object') {
    const ae = e as { response?: { data?: { message?: string } }; message?: string };
    return ae.response?.data?.message ?? ae.message ?? 'Lỗi không xác định';
  }
  return String(e);
}