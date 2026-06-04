/**
 * ProtectedRoute.tsx  (thay thế file ProtectedRouteProps.tsx cũ)
 *
 * Bảo vệ route admin:
 *  1. Chưa đăng nhập  → redirect /admin/login
 *  2. Không đủ quyền  → hiển thị trang 403
 *  3. Đủ quyền        → render children
 *
 * Cách dùng (trong routes.tsx):
 *
 *   // Bảo vệ chung – chỉ cần đăng nhập
 *   <ProtectedRoute><AdminLayout /></ProtectedRoute>
 *
 *   // Bảo vệ theo permission cụ thể
 *   <ProtectedRoute requiredPermission="staff"><StaffPage /></ProtectedRoute>
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { ShieldOff, Home } from 'lucide-react';
import { useAdminAuth, AdminPermission, getRoleLabel } from '../hooks/useAdminAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Nếu truyền vào, kiểm tra thêm permission cụ thể */
  requiredPermission?: AdminPermission;
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, role, hasPermission } = useAdminAuth();

  // Chưa đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Không đủ quyền với permission cụ thể
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDenied roleLabel={getRoleLabel(role)} />;
  }

  return <>{children}</>;
}

// ── 403 Page ─────────────────────────────────────────────────────────────────
function AccessDenied({ roleLabel }: { roleLabel: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h1>
        <p className="text-gray-500 text-sm mb-1">
          Tài khoản với vai trò <span className="font-semibold text-gray-700">{roleLabel}</span>
        </p>
        <p className="text-gray-500 text-sm mb-8">
          không có quyền truy cập trang này.
        </p>
        <a
          href="/admin"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] text-white rounded-lg text-sm font-semibold hover:bg-[#1d4ed8] transition-colors"
        >
          <Home className="w-4 h-4" />
          Về trang chủ Admin
        </a>
      </div>
    </div>
  );
}