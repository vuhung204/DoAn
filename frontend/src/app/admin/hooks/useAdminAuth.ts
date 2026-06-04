/**
 * useAdminAuth.ts
 *
 * Phân quyền theo 3 tác nhân:
 *   ROLE_SUPER_ADMIN    → Admin          → Toàn quyền
 *   ROLE_STORE_MANAGER  → Quản lý CN     → orders, refunds, warranty, inventory, reports
 *   ROLE_SALES_STAFF    → Nhân viên      → orders, refunds, warranty, inventory
 */

import { useMemo } from 'react';

export type AdminRole =
  | 'ROLE_SUPER_ADMIN'
  | 'ROLE_STORE_MANAGER'
  | 'ROLE_SALES_STAFF';

export type AdminPermission =
  | 'staff'
  | 'orders'
  | 'refunds'
  | 'warranty'
  | 'inventory'
  | 'reports'
  | 'products'
  | 'customers'
  | 'promotions';

export interface AdminAuthInfo {
  isAuthenticated: boolean;
  email:           string;
  fullName:        string;
  role:            AdminRole | null;
  roles:           AdminRole[];
  hasPermission:   (permission: AdminPermission) => boolean;
}

// ── Permission map ────────────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {

  // Admin — toàn quyền
  ROLE_SUPER_ADMIN: [
    'staff', 'orders', 'refunds', 'warranty',
    'inventory', 'reports', 'products', 'customers', 'promotions',
  ],

  // Quản lý chi nhánh — không có: products, customers, promotions, staff
  ROLE_STORE_MANAGER: [
    'orders', 'refunds', 'warranty', 'inventory', 'reports',
  ],

  // Nhân viên — không có: reports, products, customers, promotions, staff
  ROLE_SALES_STAFF: [
    'orders', 'refunds', 'warranty', 'inventory',
  ],
};

// ── JWT decode ────────────────────────────────────────────────────────────────

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const base64 = token.split('.')[1];
    const padded  = base64.replace(/-/g, '+').replace(/_/g, '/');
    const json    = decodeURIComponent(
      atob(padded)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAdminAuth(): AdminAuthInfo {
  return useMemo(() => {
    const empty: AdminAuthInfo = {
      isAuthenticated: false, email: '', fullName: '',
      role: null, roles: [], hasPermission: () => false,
    };

    const token = localStorage.getItem('access_token');
    if (!token) return empty;

    const payload = decodeJwtPayload(token);
    if (!payload) return empty;

    // Token hết hạn
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('admin_user');
      return empty;
    }

    const rolesStr: string = payload.roles || '';
    const roles = rolesStr.split(',').map(r => r.trim()).filter(Boolean) as AdminRole[];
    const role  = roles[0] ?? null;
    const email: string = payload.sub || '';

    let fullName = '';
    try {
      const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
      fullName = adminUser.fullName || adminUser.name || adminUser.email || email;
    } catch {
      fullName = email;
    }

    const allPermissions = new Set<AdminPermission>(
      roles.flatMap(r => ROLE_PERMISSIONS[r] ?? []),
    );

    return {
      isAuthenticated: true,
      email, fullName, role, roles,
      hasPermission: (p: AdminPermission) => allPermissions.has(p),
    };
  }, []);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getRoleLabel(role: AdminRole | null): string {
  switch (role) {
    case 'ROLE_SUPER_ADMIN':   return 'Admin';
    case 'ROLE_STORE_MANAGER': return 'Quản lý chi nhánh';
    case 'ROLE_SALES_STAFF':   return 'Nhân viên';
    default:                   return 'Nhân viên';
  }
}