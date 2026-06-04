/**
 * routes.tsx
 *
 * Phân quyền theo 3 tác nhân:
 *   ROLE_SUPER_ADMIN    → Admin          → Toàn quyền
 *   ROLE_STORE_MANAGER  → Quản lý CN     → orders, refunds, warranty, inventory, reports
 *   ROLE_SALES_STAFF    → Nhân viên      → orders, refunds, warranty, inventory
 */
 
import { createBrowserRouter } from 'react-router';
 
// ── Customer pages ────────────────────────────────────────────────────────────
import HomePage           from './user/pages/HomePage';
import PageItems          from './user/pages/PageItems';
import ProductDetailPage  from './user/pages/ProductDetailPage';
import CartPage           from './user/pages/CartPage';
import CheckoutPage       from './user/pages/CheckoutPage';
import OrderSuccessPage   from './user/pages/OrderSuccessPage';
import SearchPage         from './user/pages/SearchPage';
import ProfilePage        from './user/pages/ProfilePage';
import LoginPage          from './user/pages/LoginPage';
import RegisterPage       from './user/pages/RegisterPage';
import ForgotPasswordPage from './user/pages/ForgotPasswordPage';
import OrderFailedPage    from './user/pages/OrderFailedPage';
 
// ── Admin pages ───────────────────────────────────────────────────────────────
import AdminLoginPage    from './admin/pages/LoginPage';
import ProtectedRoute    from './admin/pages/ProtectedRoute';
import AdminLayout       from './admin/layouts/AdminLayout';
import Dashboard         from './admin/pages/Dashboard';
import RevenuePage       from './admin/pages/RevenuePage';
import ProductsReport    from './admin/pages/ProductsReport';
import CustomersReport   from './admin/pages/CustomersReport';
import ProductsPage      from './admin/pages/ProductsPage';
import CategoriesPage    from './admin/pages/CategoriesPage';
import BrandsPage        from './admin/pages/BrandsPage';
import OrdersPage        from './admin/pages/OrdersPage';
import RefundsPage       from './admin/pages/RefundsPage';
import InventoryPage     from './admin/pages/InventoryPage';
import CustomersPage     from './admin/pages/CustomersPage';
import ReviewsPage       from './admin/pages/ReviewsPage';
import PromotionPage     from './admin/pages/PromotionPage';
import SystemPage        from './admin/pages/SystemPage';
import AdminWarrantyPage from './admin/pages/AdminWarrantyPage';
 
export const router = createBrowserRouter([
 
  // ── Customer ──────────────────────────────────────────────────────────────
  { path: '/',                element: <HomePage /> },
  { path: '/products',        element: <PageItems /> },
  { path: '/product/:id',     element: <ProductDetailPage /> },
  { path: '/cart',            element: <CartPage /> },
  { path: '/checkout',        element: <CheckoutPage /> },
  { path: '/order-success',   element: <OrderSuccessPage /> },
  { path: '/order-failed',    element: <OrderFailedPage /> },
  { path: '/search',          element: <SearchPage /> },
  { path: '/profile',         element: <ProfilePage /> },
  { path: '/login',           element: <LoginPage /> },
  { path: '/register',        element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
 
  // ── Admin login (public) ──────────────────────────────────────────────────
  { path: '/admin/login', element: <AdminLoginPage /> },
 
  // ── Admin (protected) ─────────────────────────────────────────────────────
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
 
      // Dashboard — tất cả role
      { index: true, element: <Dashboard /> },
 
      // ── Báo cáo — Admin + Quản lý chi nhánh ─────────────────────────────
      {
        path: 'revenue',
        element: (
          <ProtectedRoute requiredPermission="reports">
            <RevenuePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'products-report',
        element: (
          <ProtectedRoute requiredPermission="reports">
            <ProductsReport />
          </ProtectedRoute>
        ),
      },
      {
        path: 'customers-report',
        element: (
          <ProtectedRoute requiredPermission="reports">
            <CustomersReport />
          </ProtectedRoute>
        ),
      },
 
      // ── Sản phẩm — Chỉ Admin ─────────────────────────────────────────────
      {
        path: 'products',
        element: (
          <ProtectedRoute requiredPermission="products">
            <ProductsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'categories',
        element: (
          <ProtectedRoute requiredPermission="products">
            <CategoriesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'brands',
        element: (
          <ProtectedRoute requiredPermission="products">
            <BrandsPage />
          </ProtectedRoute>
        ),
      },
 
      // ── Đơn hàng — Admin + Quản lý CN + Nhân viên ────────────────────────
      {
        path: 'orders',
        element: (
          <ProtectedRoute requiredPermission="orders">
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'refunds',
        element: (
          <ProtectedRoute requiredPermission="refunds">
            <RefundsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'warranty',
        element: (
          <ProtectedRoute requiredPermission="warranty">
            <AdminWarrantyPage />
          </ProtectedRoute>
        ),
      },
 
      // ── Kho — Admin + Quản lý CN + Nhân viên (xem) ───────────────────────
      {
        path: 'inventory',
        element: (
          <ProtectedRoute requiredPermission="inventory">
            <InventoryPage />
          </ProtectedRoute>
        ),
      },
 
      // ── Khách hàng — Chỉ Admin ────────────────────────────────────────────
      {
        path: 'customers',
        element: (
          <ProtectedRoute requiredPermission="customers">
            <CustomersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reviews',
        element: (
          <ProtectedRoute requiredPermission="customers">
            <ReviewsPage />
          </ProtectedRoute>
        ),
      },
 
      // ── Khuyến mãi — Chỉ Admin ───────────────────────────────────────────
      {
        path: 'promotions',
        element: (
          <ProtectedRoute requiredPermission="promotions">
            <PromotionPage />
          </ProtectedRoute>
        ),
      },
 
      // ── Hệ thống / Staff — Chỉ Admin ─────────────────────────────────────
      {
        path: 'staff',
        element: (
          <ProtectedRoute requiredPermission="staff">
            <SystemPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);