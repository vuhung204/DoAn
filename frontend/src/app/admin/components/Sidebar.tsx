import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import {
  Laptop, LayoutDashboard, TrendingUp, Box, Users,
  PackageOpen, FolderOpen, Award, ShoppingCart,
  RotateCcw, Warehouse, UserPlus, Star, Tag, Settings,
  User, Key, LogOut, Shield, Wrench,
} from 'lucide-react';
import { useAdminAuth, AdminPermission, getRoleLabel } from '../hooks/useAdminAuth';

// ── Types ─────────────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  path: string;
  icon: any;
  badge?: string;
  requiredPermission?: AdminPermission;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  requiredPermission?: AdminPermission;
}

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Dashboard & Báo Cáo',
    items: [
      { label: 'Dashboard Tổng Quan', path: '/admin',                 icon: LayoutDashboard },
      // Admin + Quản lý chi nhánh
      { label: 'Báo Cáo Doanh Thu',   path: '/admin/revenue',         icon: TrendingUp, requiredPermission: 'reports' },
      { label: 'Báo Cáo Sản Phẩm',    path: '/admin/products-report', icon: Box,        requiredPermission: 'reports' },
    ],
  },
  {
    // Chỉ Admin
    label: 'Quản Lý Sản Phẩm',
    requiredPermission: 'products',
    items: [
      { label: 'Danh Sách Sản Phẩm', path: '/admin/products',   icon: PackageOpen },
      { label: 'Danh Mục',           path: '/admin/categories', icon: FolderOpen  },
      { label: 'Thương Hiệu',        path: '/admin/brands',     icon: Award       },
    ],
  },
  {
    // Admin + Quản lý CN + Nhân viên
    label: 'Quản Lý Đơn Hàng',
    requiredPermission: 'orders',
    items: [
      { label: 'Danh Sách Đơn Hàng', path: '/admin/orders',   icon: ShoppingCart                                 },
      { label: 'Quản Lý Hoàn Trả',   path: '/admin/refunds',  icon: RotateCcw, requiredPermission: 'refunds'    },
      { label: 'Quản Lý Bảo Hành',   path: '/admin/warranty', icon: Wrench,    requiredPermission: 'warranty'   },
    ],
  },
  {
    // Admin + Quản lý CN + Nhân viên
    label: 'Quản Lý Tồn Kho',
    requiredPermission: 'inventory',
    items: [
      { label: 'Quản Lý Kho Hàng', path: '/admin/inventory', icon: Warehouse },
    ],
  },
  {
    // Chỉ Admin
    label: 'Quản Lý Khách Hàng',
    requiredPermission: 'customers',
    items: [
      { label: 'Danh Sách Khách Hàng', path: '/admin/customers', icon: UserPlus },
      { label: 'Đánh Giá',             path: '/admin/reviews',   icon: Star     },
    ],
  },
  {
    // Chỉ Admin
    label: 'Quản Lý Khuyến Mãi',
    requiredPermission: 'promotions',
    items: [
      { label: 'Mã Giảm Giá', path: '/admin/promotions', icon: Tag },
    ],
  },
  {
    // Chỉ Admin
    label: 'Chi nhánh',
    requiredPermission: 'staff',
    items: [
      { label: 'Quản Lý Chi Nhánh', path: '/admin/staff', icon: Users },
    ],
  },
];

// ── Role badge style ──────────────────────────────────────────────────────────

function getRoleBadgeClass(label: string): string {
  if (label === 'Admin')
    return 'bg-red-50 border-red-100 text-red-600';
  if (label === 'Quản lý chi nhánh')
    return 'bg-blue-50 border-blue-100 text-blue-600';
  // Nhân viên
  return 'bg-green-50 border-green-100 text-green-600';
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface SidebarProps {
  onProfileClick:  () => void;
  onPasswordClick: () => void;
  onSettingsClick: () => void;
  onLogoutClick:   () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Sidebar({
  onProfileClick,
  onPasswordClick,
  onSettingsClick,
  onLogoutClick,
}: SidebarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const { isAuthenticated, email, fullName, role, hasPermission } = useAdminAuth();

  if (!isAuthenticated) {
    navigate('/admin/login', { replace: true });
    return null;
  }

  const roleLabel   = getRoleLabel(role);
  const displayName = fullName || email || 'Admin';
  const avatarText  = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const visibleGroups = NAV_GROUPS.map(group => {
    if (group.requiredPermission && !hasPermission(group.requiredPermission)) return null;
    const visibleItems = group.items.filter(
      item => !item.requiredPermission || hasPermission(item.requiredPermission),
    );
    if (visibleItems.length === 0) return null;
    return { ...group, items: visibleItems };
  }).filter(Boolean) as NavGroup[];

  return (
    <aside
      className="bg-white border-r border-gray-200 flex flex-col h-screen overflow-y-auto overflow-x-hidden"
      style={{ width: '240px' }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-4.5 py-5 border-b border-gray-200">
        <div className="w-9 h-9 bg-[#2563eb] rounded-lg flex items-center justify-center flex-shrink-0">
          <Laptop className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="block text-[13.5px] font-extrabold text-gray-900 leading-tight">
            Laptop Store Admin
          </span>
          <span className="block text-[11px] text-gray-500">Hệ thống quản trị</span>
        </div>
      </div>

      {/* ── Role badge — màu theo role ── */}
      <div className="px-4 pt-3 pb-1">
        <div className={`flex items-center gap-1.5 border rounded-md px-2.5 py-1.5 ${getRoleBadgeClass(roleLabel)}`}>
          <Shield className="w-3 h-3 flex-shrink-0" />
          <span className="text-[11px] font-semibold truncate">{roleLabel}</span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-2">
        {visibleGroups.map((group, idx) => (
          <div key={idx} className="mb-1">
            <span className="block text-[10.5px] font-bold tracking-wider text-gray-400 uppercase px-4.5 pt-2.5 pb-1">
              {group.label}
            </span>
            {group.items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4.5 py-2.25 text-[13.5px] font-medium transition-all relative ${
                    isActive
                      ? 'bg-[#eff6ff] text-[#2563eb] font-bold'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-[#2563eb]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1 bottom-1 w-0.75 bg-[#2563eb] rounded-r-sm" />
                    )}
                    <item.icon
                      className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-[#2563eb]' : 'text-gray-500'}`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="bg-[#2563eb] text-white rounded-full px-1.75 py-0.25 text-[11px] font-bold flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Profile ── */}
      <div className="relative mt-auto">
        {showDropdown && (
          <div className="absolute bottom-full left-0 right-0 bg-white rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.15)] mb-2 overflow-hidden animate-slideUp">
            <div className="flex items-center gap-3 px-4 py-4 bg-gray-50">
              <div className="w-11 h-11 rounded-full bg-[#2563eb] text-white text-lg font-bold flex items-center justify-center flex-shrink-0">
                {avatarText}
              </div>
              <div className="min-w-0">
                <span className="block text-[13px] font-bold text-gray-900 truncate">{displayName}</span>
                <span className="block text-[11px] text-gray-500 truncate">{email}</span>
                <span className="block text-[10px] text-[#2563eb] font-semibold mt-0.5">{roleLabel}</span>
              </div>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="flex flex-col">
              <button onClick={() => { setShowDropdown(false); onProfileClick(); }}
                className="flex items-center gap-3 px-4 py-3 text-gray-900 hover:bg-gray-50 hover:text-[#2563eb] transition-all text-left">
                <User className="w-4.5 h-4.5" /><span className="text-sm">Thông tin cá nhân</span>
              </button>
              <button onClick={() => { setShowDropdown(false); onPasswordClick(); }}
                className="flex items-center gap-3 px-4 py-3 text-gray-900 hover:bg-gray-50 hover:text-[#2563eb] transition-all text-left">
                <Key className="w-4.5 h-4.5" /><span className="text-sm">Đổi mật khẩu</span>
              </button>
              <button onClick={() => { setShowDropdown(false); onSettingsClick(); }}
                className="flex items-center gap-3 px-4 py-3 text-gray-900 hover:bg-gray-50 hover:text-[#2563eb] transition-all text-left">
                <Settings className="w-4.5 h-4.5" /><span className="text-sm">Cài đặt hệ thống</span>
              </button>
              <button onClick={() => { setShowDropdown(false); onLogoutClick(); }}
                className="flex items-center gap-3 px-4 py-3 text-gray-900 hover:bg-gray-50 hover:text-red-500 transition-all text-left">
                <LogOut className="w-4.5 h-4.5" /><span className="text-sm">Đăng xuất</span>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center gap-2.5 px-4 py-3.5 border-t border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="w-8.5 h-8.5 rounded-full bg-[#2563eb] text-white text-[13px] font-extrabold flex items-center justify-center flex-shrink-0">
            {avatarText}
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="block text-[13px] font-bold text-gray-900 truncate">{displayName}</span>
            <span className="block text-[11.5px] text-gray-500 truncate">{roleLabel}</span>
          </div>
        </button>
      </div>
    </aside>
  );
}