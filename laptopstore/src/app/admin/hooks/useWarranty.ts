// src/hooks/useWarranty.ts
import { useState, useCallback } from 'react';
import {
  fetchAdminWarranties,
  fetchAdminWarrantyDetail,
  updateAdminWarrantyStatus,
  type WarrantyListItem,
  type WarrantyStatus,
  type UpdateWarrantyStatusPayload,
} from '../api/warrantyApi';

export function useWarranty() {
  const [list, setList]               = useState<WarrantyListItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError]             = useState<string | null>(null);

  const [detail, setDetail]           = useState<WarrantyListItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [updating, setUpdating]       = useState(false);

  // ── Load list ────────────────────────────────────────────────────────────
  const loadList = useCallback(async (opts?: {
    status?: WarrantyStatus | '';
    page?:   number; // 1-based (FE convention)
    size?:   number;
  }) => {
    setLoadingList(true);
    setError(null);
    try {
      const data = await fetchAdminWarranties({
        status: opts?.status,
        page:   (opts?.page ?? 1) - 1,   // convert to 0-based
        size:   opts?.size ?? 20,
      });
      setList(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      return data;
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Lỗi khi tải danh sách';
      setError(msg);
      throw e;
    } finally {
      setLoadingList(false);
    }
  }, []);

  // ── Load detail ──────────────────────────────────────────────────────────
  const loadDetail = useCallback(async (id: number) => {
    setLoadingDetail(true);
    setError(null);
    try {
      const data = await fetchAdminWarrantyDetail(id);
      setDetail(data);
      return data;
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Lỗi khi tải chi tiết';
      setError(msg);
      throw e;
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // ── Update status ────────────────────────────────────────────────────────
  const updateStatus = useCallback(async (
    id:      number,
    payload: UpdateWarrantyStatusPayload,
  ) => {
    setUpdating(true);
    setError(null);
    try {
      const updated = await updateAdminWarrantyStatus(id, payload);
      setDetail(updated);
      return updated;
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Lỗi khi cập nhật';
      setError(msg);
      throw e;
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
    // list
    list, loadingList, totalPages, totalElements, error,
    loadList,
    // detail
    detail, loadingDetail,
    loadDetail,
    // update
    updating,
    updateStatus,
  };
}