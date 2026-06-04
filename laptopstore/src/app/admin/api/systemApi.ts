import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:9765/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ══════════════════════════════════════════════════════════════════════════════
// STORE
// ══════════════════════════════════════════════════════════════════════════════

/** Khớp StoreListDto */
export interface StoreListDto {
  id: number;
  name: string;
  address: string;
  phone: string;
  city: string;
  status: 'active' | 'inactive';
}

/** Khớp StoreDetailDto */
export interface StoreDetailDto {
  id: number;
  name: string;
  address: string;
  district: string | null;
  city: string;
  phone: string;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  status: 'active' | 'inactive';
  createdAt: string | null;
  updatedAt: string | null;
  staffCount: number;
}

/** Khớp PageDto<StoreListDto> */
export interface StorePageDto {
  content: StoreListDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface CreateStoreBody {
  name: string;
  address: string;
  district?: string;
  city: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateStoreBody {
  name?: string;
  address?: string;
  district?: string;
  city?: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

/** GET /admin/stores */
export async function fetchStores(params?: {
  q?: string; status?: string;
  page?: number; size?: number;
}): Promise<StorePageDto> {
  const { data } = await api.get<StorePageDto>('/admin/stores', { params });
  return data;
}

/** GET /admin/stores/{id} */
export async function fetchStoreDetail(id: number): Promise<StoreDetailDto> {
  const { data } = await api.get<StoreDetailDto>(`/admin/stores/${id}`);
  return data;
}

/** POST /admin/stores */
export async function createStore(body: CreateStoreBody): Promise<StoreDetailDto> {
  const { data } = await api.post<StoreDetailDto>('/admin/stores', body);
  return data;
}

/** PUT /admin/stores/{id} */
export async function updateStore(id: number, body: UpdateStoreBody): Promise<StoreDetailDto> {
  const { data } = await api.put<StoreDetailDto>(`/admin/stores/${id}`, body);
  return data;
}

/** PATCH /admin/stores/{id}/status */
export async function changeStoreStatus(id: number, status: 'active' | 'inactive'): Promise<void> {
  await api.patch(`/admin/stores/${id}/status`, { status });
}

/** DELETE /admin/stores/{id} */
export async function deleteStore(id: number): Promise<void> {
  await api.delete(`/admin/stores/${id}`);
}

/** GET /admin/stores/export */
export async function exportStores(status?: string): Promise<void> {
  const response = await api.get('/admin/stores/export', {
    params: status ? { status } : undefined,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const match = (response.headers['content-disposition'] ?? '').match(/filename="?([^"]+)"?/);
  link.download = match ? match[1] : `stores-${Date.now()}.xlsx`;
  document.body.appendChild(link); link.click(); link.remove();
  window.URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════════════════════════
// STAFF
// ══════════════════════════════════════════════════════════════════════════════

/** Khớp StaffListDto */
export interface StaffListDto {
  id: number;
  fullName: string;        // BE field: fullName (mock dùng "name")
  email: string;
  phone: string | null;
  branchName: string | null;  // BE field: branchName (mock dùng "branch")
  roleName: string | null;    // BE field: roleName (mock dùng "role")
  status: 'active' | 'inactive';
}

/** Khớp StaffDetailDto */
export interface StaffDetailDto {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  storeId: number | null;
  branchName: string | null;
  roleId: number | null;
  roleName: string | null;
  permissions: string[];
  status: 'active' | 'inactive';
  createdAt: string | null;
  updatedAt: string | null;
}

/** Khớp PageDto<StaffListDto> */
export interface StaffPageDto {
  content: StaffListDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

/** Role option cho form select */
export interface RoleOption {
  id: number;
  name: string;
}

export interface CreateStaffBody {
  fullName: string;
  email: string;
  phone?: string;
  storeId: number;     // BE field: storeId (Long) — không phải branch string
  roleId: number;      // BE field: roleId (Long) — không phải role string
  password?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateStaffBody {
  fullName?: string;
  email?: string;
  phone?: string;
  storeId?: number;
  roleId?: number;
  status?: 'active' | 'inactive';
}

/** GET /admin/staff */
export async function fetchStaff(params?: {
  q?: string; storeId?: number; role?: string;
  status?: string; page?: number; size?: number;
}): Promise<StaffPageDto> {
  const { data } = await api.get<StaffPageDto>('/admin/staff', { params });
  return data;
}

/** GET /admin/staff/roles — danh sách roles cho form select */
export async function fetchRoles(): Promise<RoleOption[]> {
  const { data } = await api.get<RoleOption[]>('/admin/staff/roles');
  return data;
}

/** GET /admin/staff/{id} */
export async function fetchStaffDetail(id: number): Promise<StaffDetailDto> {
  const { data } = await api.get<StaffDetailDto>(`/admin/staff/${id}`);
  return data;
}

/** POST /admin/staff */
export async function createStaff(body: CreateStaffBody): Promise<StaffDetailDto> {
  const { data } = await api.post<StaffDetailDto>('/admin/staff', body);
  return data;
}

/** PUT /admin/staff/{id} */
export async function updateStaff(id: number, body: UpdateStaffBody): Promise<StaffDetailDto> {
  const { data } = await api.put<StaffDetailDto>(`/admin/staff/${id}`, body);
  return data;
}

/** PATCH /admin/staff/{id}/status */
export async function changeStaffStatus(id: number, status: 'active' | 'inactive'): Promise<void> {
  await api.patch(`/admin/staff/${id}/status`, { status });
}

/** DELETE /admin/staff/{id} */
export async function deleteStaff(id: number): Promise<void> {
  await api.delete(`/admin/staff/${id}`);
}

/** POST /admin/staff/{id}/reset-password */
export async function resetStaffPassword(id: number, sendEmail = false): Promise<void> {
  await api.post(`/admin/staff/${id}/reset-password`, { sendEmail });
}

/** GET /admin/staff/export */
export async function exportStaff(params?: {
  storeId?: number; role?: string; status?: string;
}): Promise<void> {
  const response = await api.get('/admin/staff/export', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const match = (response.headers['content-disposition'] ?? '').match(/filename="?([^"]+)"?/);
  link.download = match ? match[1] : `staff-${Date.now()}.xlsx`;
  document.body.appendChild(link); link.click(); link.remove();
  window.URL.revokeObjectURL(url);
}