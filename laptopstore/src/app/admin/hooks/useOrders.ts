import { useCallback, useEffect, useState } from 'react';
import {
  fetchOrders,
  fetchOrderDetail,
  updateOrderStatus,
  fetchOrdersStats,
  exportOrders,
} from '../api/orderApi';

function parseNumber(n: any): number {
  if (n == null) return 0;
  if (typeof n === 'number') return n;
  if (typeof n === 'string') {
    const v = Number(n);
    return Number.isNaN(v) ? 0 : v;
  }
  return 0;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return String(iso);
  }
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

function statusLabelFromRaw(raw: any): string {
  if (!raw && raw !== 0) return '';
  const s = String(raw).toLowerCase();
  return s === 'pending' ? 'Chờ xác nhận'
    : s === 'confirmed' ? 'Đã xác nhận'
    : s === 'processing' ? 'Đang xử lý'
    : s === 'shipping' ? 'Đang giao hàng'
    : s === 'completed' || s === 'done' ? 'Giao hàng thành công'
    : s === 'cancelled' ? 'Đã huỷ'
    : s === 'refunded' ? 'Đã hoàn tiền'
    : String(raw);
}

export function useOrders(opts: { startDate?: string; endDate?: string; storeId?: number } = {}) {
  const { startDate, endDate, storeId } = opts;

  const [list, setList] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [page, setPage] = useState<number>(1); // FE 1-based
  const [size, setSize] = useState<number>(6);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [stats, setStats] = useState<any | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async (overrides?: {
    q?: string;
    status?: string;
    branch?: string;
    storeId?: number;
    page?: number; // FE 1-based
    size?: number;
    fromDate?: string;
    toDate?: string;
  }) => {
    setLoadingList(true);
    setError(null);
    try {
      const p: any = {
        q: overrides?.q,
        status: overrides?.status,
        storeId: overrides?.storeId ?? storeId,
        page: (overrides?.page ?? page) - 1,
        size: overrides?.size ?? size,
        fromDate: overrides?.fromDate ?? startDate,
        toDate: overrides?.toDate ?? endDate,
      };

      const resp = await fetchOrders(p);
      const payload = (resp as any)?.data ?? resp;

      // debug
      // eslint-disable-next-line no-console
      console.log('useOrders.load payload =', payload);

      const content = Array.isArray(payload?.content) ? payload.content
        : Array.isArray(payload) ? payload
        : Array.isArray(payload?.data) ? payload.data
        : [];

      const mapped = (content || []).map((item: any) => {
        const orderCode = item.orderCode ?? item.order_code ?? item.code ?? String(item.orderId ?? item.id ?? '');
        const orderId = item.orderId ?? item.order_id ?? item.id;
        const customerName = item.customerName ?? item.customer?.name ?? item.customer_name ?? '';
        const branch = item.storeName ?? item.store_name ?? item.branchName ?? item.branch ?? item.store ?? '';
        const total = parseNumber(item.totalAmount ?? item.total_amount ?? item.total);
        const itemCount = Number(item.itemCount ?? item.itemsCount ?? item.item_count ?? (item.items ? item.items.length : 0) ?? 0);
        const payment = item.paymentMethod ?? item.payment ?? '';
        const payStatus = item.payStatus ?? item.pay_status ?? '';
        const status = item.status ?? '';
        const orderedAtRaw = item.orderedAt ?? item.ordered_at ?? item.orderedAtString ?? item.orderedAt;
        const orderedAt = formatDateTime(orderedAtRaw);

        return {
          id: orderCode,
          orderCode,
          dbId: orderId,
          customer: customerName,
          branch,
          total,
          productsCount: itemCount,
          payment,
          payStatus,
          status,
          date: orderedAt,
        };
      });

      setList(mapped);
      setPage((payload?.pageNumber ?? payload?.page ?? Math.max(0, (p.page))) + 1);
      setSize(payload?.pageSize ?? payload?.size ?? p.size ?? size);
      setTotalElements(payload?.totalElements ?? payload?.total ?? mapped.length);
      setTotalPages(payload?.totalPages ?? Math.max(1, Math.ceil((payload?.totalElements ?? payload?.total ?? mapped.length) / (payload?.pageSize ?? payload?.size ?? p.size ?? size))));
      return payload;
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('useOrders.load error', e);
      setError(e?.response?.data?.message ?? e?.message ?? 'Lỗi khi tải danh sách đơn');
      throw e;
    } finally {
      setLoadingList(false);
    }
  }, [page, size, startDate, endDate, storeId]);

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, page, size, startDate, endDate, storeId]);

  const loadPage = useCallback((p: number) => {
    setPage(p);
  }, []);

  const fetchOrder = useCallback(async (orderRef: string) => {
    if (!orderRef) return null;
    setLoadingDetail(true);
    setError(null);
    try {
      const resp = await fetchOrderDetail(orderRef);
      const d: any = (resp as any)?.data ?? resp;

      // debug
      // eslint-disable-next-line no-console
      console.log('useOrders.fetchOrder payload =', d);

      const customerName = d?.customer?.name ?? d?.customerName ?? d?.customer_name ?? '';
      const customerPhone = d?.customer?.phone ?? d?.phone ?? '';
      const customerEmail = d?.customer?.email ?? d?.email ?? '';

      const itemsArray = Array.isArray(d?.items) ? d.items : (Array.isArray(d?.data) ? d.data : []);
      const products = (itemsArray || []).map((it: any) => ({
        itemId: it.id ?? it.itemId ?? it.item_id,
        productId: it.product?.id ?? it.productId ?? it.product_id ?? it.productId,
        sku: it.product?.sku ?? it.sku ?? it.skuCode ?? '',
        name: it.product?.name ?? it.name ?? '',
        quantity: Number(it.quantity ?? it.qty ?? it.amount ?? 0),
        unitPrice: parseNumber(it.unitPrice ?? it.unit_price ?? it.price ?? 0),
        totalPrice: parseNumber(it.totalPrice ?? it.total_price ?? (it.quantity && it.unitPrice ? it.quantity * it.unitPrice : 0)),
      }));

      const mapped = {
        orderId: d?.orderId ?? d?.order_id ?? d?.id,
        orderCode: d?.orderCode ?? d?.order_code ?? d?.code ?? '',
        userId: d?.userId ?? d?.user_id ?? d?.user?.id ?? null,
        // primitives for UI
        customerName,
        phone: customerPhone,
        email: customerEmail,
        // also keep structured customer if needed
        customer: { name: customerName, phone: customerPhone, email: customerEmail },
        // address
        shippingAddress: {
          recipientName: d?.address?.recipientName ?? d?.shippingAddress?.recipientName ?? d?.shippingAddress?.name ?? '',
          phone: d?.address?.phone ?? d?.shippingAddress?.phone ?? '',
          addressLine: d?.address?.addressLine ?? d?.shippingAddress?.addressLine ?? d?.addressLine ?? '',
          ward: d?.address?.ward ?? d?.shippingAddress?.ward ?? '',
          district: d?.address?.district ?? d?.shippingAddress?.district ?? '',
          city: d?.address?.city ?? d?.shippingAddress?.city ?? '',
        },
        branchName: d?.branchName ?? d?.storeName ?? d?.store ?? '',
        paymentMethod: d?.paymentMethod ?? d?.payment ?? '',
        payStatus: d?.payStatus ?? d?.pay_status ?? '',
        status: d?.status ?? '',
        subtotal: parseNumber(d?.subtotal ?? d?.sub_total ?? 0),
        discountAmount: parseNumber(d?.discountAmount ?? d?.discount_amount ?? 0),
        shippingFee: parseNumber(d?.shippingFee ?? d?.shipping_fee ?? 0),
        totalAmount: parseNumber(d?.totalAmount ?? d?.total_amount ?? d?.total ?? 0),
        note: d?.note ?? '',
        orderedAt: formatDateTime(d?.orderedAt ?? d?.ordered_at ?? d?.orderedAtString),
        // Provide both keys to be compatible with different components
        products: products || [],
        items: products || [],
        history: Array.isArray(d?.history) ? (d.history.map((h: any) => ({
          label: h?.label ?? statusLabelFromRaw(h?.newStatus ?? h?.status),
          time: formatDateTime(h?.time ?? h?.createdAt ?? h?.created_at),
          staff: h?.staff?.name ?? h?.staffName ?? h?.staff ?? null,
          note: h?.note ?? h?.staffNote ?? '',
          done: Boolean(h?.done ?? (['completed', 'done', 'cancelled', 'refunded'].includes(String(h?.newStatus ?? h?.status).toLowerCase())))
        }))) : []
      };

      setDetail(mapped);
      return mapped;
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('useOrders.fetchOrder error', e);
      setError(e?.response?.data?.message ?? e?.message ?? 'Lỗi khi tải chi tiết đơn');
      throw e;
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const updateOrderStatusHandler = useCallback(async (
    orderRef: string,
    status: string,
    staffNote?: string,
    storeId?: number      // <-- thêm
  ) => {
    setError(null);
    try {
      await updateOrderStatus(orderRef, status, staffNote, storeId);  // <-- truyền vào
      await fetchOrder(orderRef).catch(() => {});
      await load().catch(() => {});
      return true;
    } catch (e: any) {
      console.error('useOrders.updateOrderStatus error', e);
      setError(e?.response?.data?.message ?? e?.message ?? 'Lỗi khi cập nhật trạng thái');
      throw e;
    }
  }, [fetchOrder, load]);

  const fetchStatsHandler = useCallback(async (opts?: { fromDate?: string; toDate?: string; storeId?: number }) => {
    try {
      const params = {
        fromDate: opts?.fromDate ?? startDate,
        toDate: opts?.toDate ?? endDate,
        storeId: opts?.storeId ?? storeId,
      };
      const resp = await fetchOrdersStats(params);
      const payload = (resp as any)?.data ?? resp;
      // eslint-disable-next-line no-console
      console.log('useOrders.fetchStats payload =', payload);
      setStats(payload);
      return payload;
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('useOrders.fetchStats error', e);
      return null;
    }
  }, [startDate, endDate, storeId]);

  const handleExport = useCallback(async (params?: {
    exportType?: string;
    q?: string;
    status?: string;
    storeId?: number;
    fromDate?: string;
    toDate?: string;
  }) => {
    setExporting(true);
    try {
      await exportOrders({
        exportType: params?.exportType ?? 'LIST',
        q: params?.q,
        status: params?.status,
        storeId: params?.storeId ?? storeId,
        fromDate: params?.fromDate ?? startDate,
        toDate: params?.toDate ?? endDate,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('useOrders.handleExport error', e);
      throw e;
    } finally {
      setExporting(false);
    }
  }, [startDate, endDate, storeId]);

  const refetch = useCallback(() => load().catch(() => {}), [load]);

  return {
    // list
    list,
    loadingList,
    page,
    size,
    totalPages,
    totalElements,
    stats,
    error,
    setPage,
    setSize,
    fetchOrders: load,
    loadPage,
    // detail
    detail,
    loadingDetail,
    fetchOrder,
    updateOrderStatus: updateOrderStatusHandler,
    // stats & export
    fetchStats: fetchStatsHandler,
    handleExport,
    exporting,
    // convenience
    refetch,
  };
}