import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  AlertCircle, Bell, Camera, CheckCircle, ChevronRight, Clock,
  CreditCard, Edit, Eye, Heart, Loader2, Lock, Mail, MapPin,
  Package, Phone, Plus, Save, Settings, Star, Trash2, Truck,
  User, X,
} from 'lucide-react';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import api, { ENDPOINTS } from '../config/apiConfig';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = 'overview' | 'profile' | 'orders' | 'wishlist' | 'addresses' | 'password' | 'notifications';

interface ProfileSection   { id: number; fullName: string; email: string; phone: string | null; avatarUrl: string | null; status: string; }
interface OrderSummary     { totalOrders: number; totalSpent: number; customerType: string; memberLevel: string; }
interface AddressItem      { id: number; recipientName: string; phone: string; addressLine: string; ward: string | null; district: string; city: string; isDefault: boolean; }
interface WishlistItem     { productId: number; productName: string; slug: string; basePrice: number; salePrice: number | null; primaryImage: string | null; brandName: string; addedAt: string; }
interface RecentOrder      { id: number; orderCode: string; status: string; totalAmount: number; orderedAt: string; itemCount: number; firstItemImage: string | null; firstItemName: string | null; }

interface DashboardResponse {
  profile:      ProfileSection;
  orderSummary: OrderSummary;
  addresses:    AddressItem[];
  wishlist:     WishlistItem[];
  recentOrders: RecentOrder[];
}

interface OrderItemFull    { productId: number; productName: string; brandName: string | null; image: string | null; quantity: number; unitPrice: number; totalPrice: number; }
interface OrderFull        { id: number; orderCode: string; status: string; subtotal: number; discountAmount: number; shippingFee: number; totalAmount: number; note: string | null; orderedAt: string; items: OrderItemFull[]; }
// district vẫn giữ trong type để tương thích BE, nhưng FE không hiển thị field này
interface AddressRequest   { recipientName: string; phone: string; addressLine: string; ward?: string; district: string; city: string; isDefault: boolean; }
interface UpdateProfile    { fullName: string; phone: string; avatarUrl: string; }

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1704726135027-9c6f034cfa41?w=200&q=80';

// district giữ "" để BE không lỗi validation
const EMPTY_ADDRESS: AddressRequest = { recipientName: '', phone: '', addressLine: '', ward: '', district: '', city: '', isDefault: false };

/** Các trạng thái mà user được phép hủy đơn */
const CANCELLABLE_STATUSES = new Set(['pending', 'confirmed']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt   = (n: number) => `${n.toLocaleString('vi-VN')}₫`;
const fmtDt = (s: string) => new Date(s).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const fmtD  = (s: string) => new Date(s).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });

/** Ghép địa chỉ hiển thị — bỏ district, chỉ giữ addressLine, ward, city */
const formatAddress = (a: Pick<AddressItem, 'addressLine' | 'ward' | 'city'>) =>
  [a.addressLine, a.ward, a.city].filter(Boolean).join(', ');

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: 'Chờ xác nhận', color: 'border-amber-200 bg-amber-50 text-amber-700',   icon: <Clock className="size-4 text-amber-600" /> },
  confirmed:  { label: 'Đã xác nhận',  color: 'border-amber-200 bg-amber-50 text-amber-700',   icon: <Clock className="size-4 text-amber-600" /> },
  processing: { label: 'Đang xử lý',   color: 'border-orange-200 bg-orange-50 text-orange-700',icon: <Package className="size-4 text-orange-600" /> },
  shipping:   { label: 'Đang giao',    color: 'border-blue-200 bg-blue-50 text-blue-700',       icon: <Truck className="size-4 text-blue-600" /> },
  delivered:  { label: 'Đã giao',      color: 'border-green-200 bg-green-50 text-green-700',   icon: <CheckCircle className="size-4 text-green-600" /> },
  completed:  { label: 'Hoàn thành',   color: 'border-green-200 bg-green-50 text-green-700',   icon: <CheckCircle className="size-4 text-green-600" /> },
  cancelled:  { label: 'Đã hủy',       color: 'border-red-200 bg-red-50 text-red-700',         icon: <X className="size-4 text-red-600" /> },
  refunded:   { label: 'Đã hoàn tiền', color: 'border-red-200 bg-red-50 text-red-700',         icon: <X className="size-4 text-red-600" /> },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status.toLowerCase()] ?? { label: status, color: 'border-gray-200 bg-gray-50 text-gray-700', icon: <Package className="size-4" /> };
  return (
    <Badge variant="outline" className={s.color}>
      {s.icon}<span className="ml-1">{s.label}</span>
    </Badge>
  );
}

// ─── Cancel Confirm Dialog ────────────────────────────────────────────────────

function CancelDialog({
  orderCode,
  onConfirm,
  onClose,
  loading,
}: {
  orderCode: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100">
          <X className="size-6 text-red-600" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-gray-900">Xác nhận hủy đơn hàng</h3>
        <p className="mb-6 text-sm text-gray-600">
          Bạn có chắc muốn hủy đơn <span className="font-semibold text-gray-900">#{orderCode}</span>?
          Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Giữ đơn hàng
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />Đang hủy...</> : 'Xác nhận hủy'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  // ── Dashboard data (1 call) ─────────────────────────────────────────────────
  const [dash, setDash] = useState<DashboardResponse | null>(null);

  // ── Full orders list (lazy — chỉ load khi vào tab orders) ──────────────────
  const [orders,        setOrders]        = useState<OrderFull[]>([]);
  const [ordersLoaded,  setOrdersLoaded]  = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError,   setOrdersError]   = useState('');

  // ── Cancel order state ──────────────────────────────────────────────────────
  const [cancellingId,    setCancellingId]    = useState<number | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [cancelError,     setCancelError]     = useState('');

  // ── Mutate states ───────────────────────────────────────────────────────────
  const [editMode,      setEditMode]      = useState(false);
  const [profileForm,   setProfileForm]   = useState<UpdateProfile>({ fullName: '', phone: '', avatarUrl: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg,    setProfileMsg]    = useState('');

  const [pwForm,      setPwForm]      = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPw,    setSavingPw]    = useState(false);
  const [pwMsg,       setPwMsg]       = useState('');

  const [addrForm,       setAddrForm]       = useState<AddressRequest>(EMPTY_ADDRESS);
  const [editingAddrId,  setEditingAddrId]  = useState<number | null>(null);
  const [showAddrForm,   setShowAddrForm]   = useState(false);
  const [savingAddr,     setSavingAddr]     = useState(false);
  const [addrMsg,        setAddrMsg]        = useState('');

  // ── Initial load ────────────────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) { navigate('/login'); return; }

    api.get<DashboardResponse>(ENDPOINTS.USER.DASHBOARD)
      .then((res) => {
        setDash(res.data);
        const p = res.data.profile;
        setProfileForm({ fullName: p.fullName, phone: p.phone ?? '', avatarUrl: p.avatarUrl ?? '' });
      })
      .catch((err) => {
        if (err.response?.status === 401) { navigate('/login'); return; }
        setError(err.response?.data?.message ?? 'Không thể tải trang tài khoản.');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // ── Lazy load full orders ────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab !== 'orders' || ordersLoaded || ordersLoading) return;
    setOrdersLoading(true);
    api.get<OrderFull[]>(ENDPOINTS.ORDERS.BASE)
      .then((res) => { setOrders(res.data); setOrdersLoaded(true); })
      .catch((err) => setOrdersError(err.response?.data?.message ?? 'Không thể tải đơn hàng.'))
      .finally(() => setOrdersLoading(false));
  }, [activeTab, ordersLoaded, ordersLoading]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const defaultAddress = useMemo(
    () => dash?.addresses.find((a) => a.isDefault),
    [dash?.addresses],
  );

  // ── Cancel order handler ─────────────────────────────────────────────────────

  const handleCancelOrder = async (orderId: number) => {
    setCancellingId(orderId);
    setCancelError('');
    try {
      await api.put(`${ENDPOINTS.ORDERS.BASE}/${orderId}/cancel`);
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: 'cancelled' } : o)
      );
      setConfirmCancelId(null);
    } catch (err: any) {
      setCancelError(err.response?.data?.message ?? 'Không thể hủy đơn hàng. Vui lòng thử lại.');
    } finally {
      setCancellingId(null);
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    if (!editMode) { setEditMode(true); return; }
    setSavingProfile(true); setProfileMsg('');
    try {
      const res = await api.put(ENDPOINTS.USER.PROFILE, profileForm);
      setDash((d) => d ? { ...d, profile: { ...d.profile, ...res.data } } : d);
      setEditMode(false);
      setProfileMsg('Đã cập nhật thông tin cá nhân.');
    } catch (err: any) {
      setProfileMsg(err.response?.data?.message ?? 'Không thể cập nhật hồ sơ.');
    } finally { setSavingProfile(false); }
  };

  const handleSavePassword = async () => {
    setPwMsg('');
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) { setPwMsg('Vui lòng nhập đầy đủ.'); return; }
    if (pwForm.newPassword.length < 8) { setPwMsg('Mật khẩu mới phải có ít nhất 8 ký tự.'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg('Xác nhận mật khẩu chưa khớp.'); return; }
    setSavingPw(true);
    try {
      await api.put(ENDPOINTS.USER.PASSWORD, { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwMsg('Đổi mật khẩu thành công.');
    } catch (err: any) {
      setPwMsg(err.response?.data?.message ?? 'Không thể đổi mật khẩu.');
    } finally { setSavingPw(false); }
  };

  const reloadAddresses = async () => {
    const res = await api.get<AddressItem[]>(ENDPOINTS.USER.ADDRESSES);
    setDash((d) => d ? { ...d, addresses: res.data } : d);
  };

  const openNewAddr  = () => { setEditingAddrId(null); setAddrForm(EMPTY_ADDRESS); setShowAddrForm(true); setAddrMsg(''); };
  const openEditAddr = (a: AddressItem) => {
    setEditingAddrId(a.id);
    setAddrForm({
      recipientName: a.recipientName,
      phone: a.phone,
      addressLine: a.addressLine,
      ward: a.ward ?? '',
      district: a.district, // giữ lại giá trị cũ từ BE, không hiển thị trên form
      city: a.city,
      isDefault: a.isDefault,
    });
    setShowAddrForm(true); setAddrMsg('');
  };

  const handleSaveAddr = async () => {
    setAddrMsg('');
    // Validation: bỏ district khỏi required check
    if (!addrForm.recipientName || !addrForm.phone || !addrForm.addressLine || !addrForm.city) {
      setAddrMsg('Vui lòng nhập đầy đủ thông tin.'); return;
    }
    setSavingAddr(true);
    try {
      // Vẫn gửi district lên BE (giá trị "" hoặc giá trị cũ) để không lỗi
      const payload = { ...addrForm, ward: addrForm.ward || undefined };
      if (editingAddrId) await api.put(`${ENDPOINTS.USER.ADDRESSES}/${editingAddrId}`, payload);
      else               await api.post(ENDPOINTS.USER.ADDRESSES, payload);
      await reloadAddresses();
      setShowAddrForm(false); setEditingAddrId(null); setAddrForm(EMPTY_ADDRESS);
      setAddrMsg('Đã lưu địa chỉ.');
    } catch (err: any) {
      setAddrMsg(err.response?.data?.message ?? 'Không thể lưu địa chỉ.');
    } finally { setSavingAddr(false); }
  };

  const handleDeleteAddr = async (id: number) => {
    try { await api.delete(`${ENDPOINTS.USER.ADDRESSES}/${id}`); await reloadAddresses(); setAddrMsg('Đã xóa địa chỉ.'); }
    catch (err: any) { setAddrMsg(err.response?.data?.message ?? 'Không thể xóa địa chỉ.'); }
  };

  const handleSetDefaultAddr = async (a: AddressItem) => {
    try {
      await api.put(`${ENDPOINTS.USER.ADDRESSES}/${a.id}`, { ...a, ward: a.ward || undefined, isDefault: true });
      await reloadAddresses(); setAddrMsg('Đã cập nhật địa chỉ mặc định.');
    } catch (err: any) { setAddrMsg(err.response?.data?.message ?? 'Không thể cập nhật.'); }
  };

  const handleRemoveWishlist = async (productId: number) => {
    try {
      await api.delete(ENDPOINTS.WISHLIST.ITEM(productId));
      setDash((d) => d ? { ...d, wishlist: d.wishlist.filter((w) => w.productId !== productId) } : d);
    } catch { /* giữ stable */ }
  };

  // ── Guards ───────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Header />
      <div className="flex h-96 items-center justify-center"><Loader2 className="size-10 animate-spin text-red-600" /></div>
    </div>
  );

  if (!dash) return (
    <div className="min-h-screen bg-gray-50"><Header />
      <div className="container mx-auto px-4 py-16">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{error || 'Không thể tải hồ sơ.'}</div>
      </div>
    </div>
  );

  const { profile, orderSummary, addresses, wishlist, recentOrders } = dash;

  // ── Tabs config ─────────────────────────────────────────────────────────────

  const tabs: [ActiveTab, React.ReactNode, string][] = [
    ['overview',      <User className="size-5" />,     'Tổng quan'],
    ['profile',       <Settings className="size-5" />, 'Thông tin cá nhân'],
    ['orders',        <Package className="size-5" />,  'Đơn hàng'],
    ['wishlist',      <Heart className="size-5" />,    'Yêu thích'],
    ['addresses',     <MapPin className="size-5" />,   'Địa chỉ'],
    ['password',      <Lock className="size-5" />,     'Đổi mật khẩu'],
    ['notifications', <Bell className="size-5" />,     'Thông báo'],
  ];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Cancel Confirm Dialog */}
      {confirmCancelId !== null && (() => {
        const order = orders.find((o) => o.id === confirmCancelId);
        if (!order) return null;
        return (
          <CancelDialog
            orderCode={order.orderCode}
            loading={cancellingId === confirmCancelId}
            onConfirm={() => handleCancelOrder(confirmCancelId)}
            onClose={() => { setConfirmCancelId(null); setCancelError(''); }}
          />
        );
      })()}

      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-red-600">Trang chủ</Link>
            <ChevronRight className="size-4" />
            <span className="text-gray-900">Tài khoản của tôi</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="size-5 flex-shrink-0" /><span>{error}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-12">
          {/* ───────────────── SIDEBAR ───────────────── */}
          <div className="lg:col-span-3">
            <div className="sticky top-24 overflow-hidden rounded-3xl border border-white/20 bg-white shadow-xl">

              {/* Cover */}
              <div className="relative h-32 bg-gradient-to-r from-red-600 via-red-500 to-orange-500">
                <div className="absolute inset-0 opacity-20">
                  <div className="h-full w-full bg-[linear-gradient(to_right,#ffffff22_1px,transparent_1px),linear-gradient(to_bottom,#ffffff22_1px,transparent_1px)] bg-[size:30px_30px]" />
                </div>
              </div>

              {/* User */}
              <div className="relative px-6 pb-6">
                <div className="-mt-14 flex flex-col items-center">
                  <div className="relative">
                    <ImageWithFallback
                      src={profile.avatarUrl || DEFAULT_AVATAR}
                      alt={profile.fullName}
                      className="size-28 rounded-full border-4 border-white object-cover shadow-xl"
                    />
                    <button className="absolute bottom-1 right-1 flex size-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-all hover:scale-105 hover:bg-red-700">
                      <Camera className="size-4" />
                    </button>
                  </div>

                  <h2 className="mt-4 text-xl font-bold text-gray-900">{profile.fullName}</h2>
                  <p className="mt-1 text-sm text-gray-500">{profile.email}</p>

                  <div className="mt-4 flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-2 text-sm font-semibold text-white shadow-md">
                    <Star className="size-4 fill-white text-white" />
                    {orderSummary.memberLevel}
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-red-50 p-3 text-center">
                    <p className="text-xl font-black text-red-600">{orderSummary.totalOrders}</p>
                    <p className="mt-1 text-xs text-gray-500">Đơn hàng</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-3 text-center">
                    <p className="text-xl font-black text-blue-600">{wishlist.length}</p>
                    <p className="mt-1 text-xs text-gray-500">Yêu thích</p>
                  </div>
                  <div className="rounded-2xl bg-green-50 p-3 text-center">
                    <p className="text-xl font-black text-green-600">{(orderSummary.totalSpent / 1_000_000).toFixed(1)}M</p>
                    <p className="mt-1 text-xs text-gray-500">Chi tiêu</p>
                  </div>
                </div>

                {/* Menu */}
                <nav className="mt-8 space-y-2">
                  {tabs.map(([tab, icon, label]) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300 ${
                        activeTab === tab
                          ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-red-600'
                      }`}
                    >
                      <div className={`flex size-10 items-center justify-center rounded-xl transition-all ${
                        activeTab === tab ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-red-100'
                      }`}>
                        {icon}
                      </div>
                      <span className="flex-1 text-left font-medium">{label}</span>
                      {tab === 'wishlist' && wishlist.length > 0 && (
                        <div className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          activeTab === tab ? 'bg-white text-red-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {wishlist.length}
                        </div>
                      )}
                    </button>
                  ))}
                </nav>

                {/* Logout */}
                <Button
                  variant="outline"
                  className="mt-8 h-12 w-full rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => { logout(); navigate('/login'); }}
                >
                  Đăng xuất
                </Button>
              </div>
            </div>
          </div>

          {/* ── Content ──────────────────────────────────────────────────────── */}
          <div className="lg:col-span-9">

            {/* ───────────────── OVERVIEW ───────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Welcome */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 p-8 text-white shadow-2xl">
                  <div className="absolute inset-0 opacity-10">
                    <div className="h-full w-full bg-[linear-gradient(to_right,#ffffff22_1px,transparent_1px),linear-gradient(to_bottom,#ffffff22_1px,transparent_1px)] bg-[size:40px_40px]" />
                  </div>
                  <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur-md">
                        ✨ Thành viên {orderSummary.memberLevel}
                      </div>
                      <h2 className="text-3xl font-black md:text-4xl">Xin chào, {profile.fullName}</h2>
                      <p className="mt-3 max-w-2xl text-red-100">
                        Quản lý đơn hàng, sản phẩm yêu thích và thông tin tài khoản của bạn tại Laptop Store.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <Button
                        className="h-12 rounded-2xl bg-white px-6 text-red-600 hover:bg-gray-100"
                        onClick={() => setActiveTab('orders')}
                      >
                        Đơn hàng
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 rounded-2xl border-white/30 bg-white/10 px-6 text-white backdrop-blur-md hover:bg-white/20"
                        onClick={() => setActiveTab('profile')}
                      >
                        Hồ sơ
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="group rounded-3xl border border-red-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tổng đơn hàng</p>
                        <h3 className="mt-3 text-4xl font-black text-gray-900">{orderSummary.totalOrders}</h3>
                        <p className="mt-2 text-sm text-green-600">+12% tháng này</p>
                      </div>
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                        <Package className="size-8" />
                      </div>
                    </div>
                  </div>
                  <div className="group rounded-3xl border border-blue-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tổng chi tiêu</p>
                        <h3 className="mt-3 text-4xl font-black text-gray-900">{(orderSummary.totalSpent / 1_000_000).toFixed(1)}M</h3>
                        <p className="mt-2 text-sm text-blue-600">VNĐ</p>
                      </div>
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                        <CreditCard className="size-8" />
                      </div>
                    </div>
                  </div>
                  <div className="group rounded-3xl border border-pink-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Yêu thích</p>
                        <h3 className="mt-3 text-4xl font-black text-gray-900">{wishlist.length}</h3>
                        <p className="mt-2 text-sm text-pink-600">Sản phẩm</p>
                      </div>
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
                        <Heart className="size-8" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PROFILE */}
            {activeTab === 'profile' && (
              <div className="rounded-lg border bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Thông tin cá nhân</h2>
                  <Button onClick={handleSaveProfile} disabled={savingProfile} variant={editMode ? 'default' : 'outline'}>
                    {savingProfile ? <><Loader2 className="mr-2 size-4 animate-spin" />Đang lưu...</>
                      : editMode ? <><Save className="mr-2 size-4" />Lưu thay đổi</>
                      : <><Edit className="mr-2 size-4" />Chỉnh sửa</>}
                  </Button>
                </div>
                {profileMsg && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{profileMsg}</div>}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label>Họ và tên</Label>
                    <Input className="mt-2" value={profileForm.fullName} disabled={!editMode}
                      onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                      <Input value={profile.email} disabled className="pl-10" />
                    </div>
                  </div>
                  <div>
                    <Label>Số điện thoại</Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                      <Input className="pl-10" value={profileForm.phone} disabled={!editMode}
                        onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Avatar URL</Label>
                    <div className="relative mt-2">
                      <Camera className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                      <Input className="pl-10" value={profileForm.avatarUrl} disabled={!editMode}
                        onChange={(e) => setProfileForm((p) => ({ ...p, avatarUrl: e.target.value }))} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Địa chỉ mặc định</Label>
                    <div className="mt-2 rounded-lg border bg-gray-50 p-3 text-sm text-gray-600">
                      {defaultAddress ? formatAddress(defaultAddress) : 'Chưa có địa chỉ mặc định'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ORDERS */}
            {activeTab === 'orders' && (
              <div className="rounded-lg border bg-white p-6">
                <h2 className="mb-6 text-2xl font-bold">Đơn hàng của tôi</h2>

                {cancelError && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="size-4 flex-shrink-0" />
                    <span>{cancelError}</span>
                    <button className="ml-auto" onClick={() => setCancelError('')}><X className="size-4" /></button>
                  </div>
                )}

                {ordersLoading && <div className="flex items-center justify-center py-8 text-gray-500"><Loader2 className="mr-2 size-5 animate-spin" />Đang tải...</div>}
                {ordersError   && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{ordersError}</div>}
                {!ordersLoading && !ordersError && orders.length === 0 && (
                  <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">Chưa có đơn hàng nào.</div>
                )}

                <div className="space-y-4">
                  {orders.map((order) => {
                    const isCancellable = CANCELLABLE_STATUSES.has(order.status.toLowerCase());
                    const isCancelling  = cancellingId === order.id;

                    return (
                      <div key={order.id} className="rounded-lg border p-6 transition-shadow hover:shadow-md">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b pb-4">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">Mã: <span className="font-semibold">#{order.orderCode}</span></span>
                            <StatusBadge status={order.status} />
                          </div>
                          <span className="text-sm text-gray-500">{fmtDt(order.orderedAt)}</span>
                        </div>

                        {order.items.map((item) => (
                          <div key={item.productId} className="mb-4 flex items-center gap-4">
                            <div className="size-20 flex-shrink-0 overflow-hidden rounded border bg-gray-50">
                              {item.image
                                ? <img src={item.image} alt={item.productName} className="size-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                : <div className="flex size-full items-center justify-center text-xs text-gray-400">Laptop</div>}
                            </div>
                            <div className="flex-1">
                              {item.brandName && <p className="mb-0.5 text-xs text-gray-500">{item.brandName}</p>}
                              <h4 className="mb-1 line-clamp-2 font-medium">{item.productName}</h4>
                              <p className="text-sm text-gray-600">{fmt(item.unitPrice)} × {item.quantity}</p>
                            </div>
                            <p className="text-lg font-semibold text-red-600">{fmt(item.totalPrice)}</p>
                          </div>
                        ))}

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/order-success?orderId=${order.id}`}>
                                <Eye className="mr-2 size-4" />Chi tiết
                              </Link>
                            </Button>
                            {isCancellable && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                disabled={isCancelling}
                                onClick={() => { setCancelError(''); setConfirmCancelId(order.id); }}
                              >
                                {isCancelling
                                  ? <><Loader2 className="mr-2 size-4 animate-spin" />Đang hủy...</>
                                  : <><X className="mr-2 size-4" />Hủy đơn</>}
                              </Button>
                            )}
                          </div>
                          <span className="text-xl font-bold">{fmt(order.totalAmount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WISHLIST */}
            {activeTab === 'wishlist' && (
              <div className="rounded-lg border bg-white p-6">
                <h2 className="mb-6 text-2xl font-bold">Sản phẩm yêu thích ({wishlist.length})</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {wishlist.length === 0 && (
                    <div className="rounded-lg border border-dashed p-8 text-center text-gray-500 md:col-span-2">Chưa có sản phẩm yêu thích nào.</div>
                  )}
                  {wishlist.map((item) => {
                    const price = item.salePrice ?? item.basePrice;
                    const hasDiscount = item.salePrice != null && item.salePrice < item.basePrice;
                    return (
                      <div key={item.productId} className="overflow-hidden rounded-lg border transition-shadow hover:shadow-md">
                        <div className="relative">
                          <ImageWithFallback src={item.primaryImage || ''} alt={item.productName} className="h-48 w-full object-cover" />
                          <button onClick={() => handleRemoveWishlist(item.productId)}
                            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 backdrop-blur-sm hover:bg-white">
                            <Heart className="size-5 fill-red-600 text-red-600" />
                          </button>
                        </div>
                        <div className="p-4">
                          <Badge variant="outline" className="mb-2">{item.brandName}</Badge>
                          <h3 className="mb-2 line-clamp-2 font-semibold">{item.productName}</h3>
                          <p className="mb-3 text-sm text-gray-500">Đã thêm: {fmtD(item.addedAt)}</p>
                          <div className="mb-4 flex items-baseline gap-2">
                            <span className="text-xl font-bold text-red-600">{fmt(price)}</span>
                            {hasDiscount && <span className="text-sm text-gray-400 line-through">{fmt(item.basePrice)}</span>}
                          </div>
                          <Button className="w-full bg-red-600 hover:bg-red-700" size="sm" asChild>
                            <Link to={`/product/${item.productId}`}>Xem chi tiết</Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ADDRESSES */}
            {activeTab === 'addresses' && (
              <div className="rounded-lg border bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Địa chỉ giao hàng</h2>
                  <Button onClick={openNewAddr}><Plus className="mr-2 size-4" />Thêm mới</Button>
                </div>
                {addrMsg && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{addrMsg}</div>}

                {showAddrForm && (
                  <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-5">
                    <h3 className="mb-4 text-lg font-semibold">{editingAddrId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Người nhận & SĐT */}
                      {([['recipientName', 'Người nhận'], ['phone', 'Số điện thoại']] as [keyof AddressRequest, string][]).map(([field, label]) => (
                        <div key={field}>
                          <Label>{label}</Label>
                          <Input className="mt-2" value={String(addrForm[field] ?? '')}
                            onChange={(e) => setAddrForm((f) => ({ ...f, [field]: e.target.value }))} />
                        </div>
                      ))}

                      {/* Địa chỉ chi tiết */}
                      <div className="md:col-span-2">
                        <Label>Địa chỉ chi tiết</Label>
                        <Input className="mt-2" value={addrForm.addressLine}
                          onChange={(e) => setAddrForm((f) => ({ ...f, addressLine: e.target.value }))} />
                      </div>

                      {/* Phường/Xã & Tỉnh/Thành phố — bỏ Quận/Huyện */}
                      {([['ward', 'Phường/Xã'], ['city', 'Tỉnh/Thành phố']] as [keyof AddressRequest, string][]).map(([field, label]) => (
                        <div key={field}>
                          <Label>{label}</Label>
                          <Input className="mt-2" value={String(addrForm[field] ?? '')}
                            onChange={(e) => setAddrForm((f) => ({ ...f, [field]: e.target.value }))} />
                        </div>
                      ))}

                      {/* Checkbox mặc định */}
                      <div className="flex items-center gap-2 pt-8">
                        <input type="checkbox" id="isDefault" checked={addrForm.isDefault} className="size-4 accent-red-600"
                          onChange={(e) => setAddrForm((f) => ({ ...f, isDefault: e.target.checked }))} />
                        <Label htmlFor="isDefault">Đặt làm địa chỉ mặc định</Label>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button onClick={handleSaveAddr} disabled={savingAddr}>
                        {savingAddr ? <><Loader2 className="mr-2 size-4 animate-spin" />Đang lưu...</> : 'Lưu địa chỉ'}
                      </Button>
                      <Button variant="outline" onClick={() => { setShowAddrForm(false); setEditingAddrId(null); }}>Hủy</Button>
                    </div>
                  </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  {addresses.length === 0 && <div className="rounded-lg border border-dashed p-8 text-center text-gray-500 md:col-span-2">Chưa có địa chỉ nào.</div>}
                  {addresses.map((a) => (
                    <div key={a.id} className="relative rounded-lg border p-6 transition-shadow hover:shadow-md">
                      {a.isDefault && <Badge className="absolute right-4 top-4 bg-red-600">Mặc định</Badge>}
                      <h3 className="mb-2 text-lg font-bold">{a.recipientName}</h3>
                      <div className="mb-4 space-y-2 text-sm text-gray-600">
                        <p className="flex items-center gap-2"><Phone className="size-4" />{a.phone}</p>
                        <p className="flex items-start gap-2">
                          <MapPin className="mt-0.5 size-4 flex-shrink-0" />
                          {/* Hiển thị không có district */}
                          <span>{formatAddress(a)}</span>
                        </p>
                      </div>
                      <div className="flex gap-2 border-t pt-4">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditAddr(a)}><Edit className="mr-2 size-4" />Sửa</Button>
                        {!a.isDefault && (
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDeleteAddr(a.id)}><Trash2 className="mr-2 size-4" />Xóa</Button>
                        )}
                      </div>
                      {!a.isDefault && (
                        <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => handleSetDefaultAddr(a)}>Đặt làm mặc định</Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PASSWORD */}
            {activeTab === 'password' && (
              <div className="rounded-lg border bg-white p-6">
                <h2 className="mb-6 text-2xl font-bold">Đổi mật khẩu</h2>
                {pwMsg && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{pwMsg}</div>}
                <div className="max-w-md space-y-6">
                  {([['currentPassword', 'Mật khẩu hiện tại'], ['newPassword', 'Mật khẩu mới'], ['confirmPassword', 'Xác nhận mật khẩu mới']] as [keyof typeof pwForm, string][]).map(([field, label]) => (
                    <div key={field}>
                      <Label>{label}</Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                        <Input type="password" className="pl-10" value={pwForm[field]}
                          onChange={(e) => setPwForm((f) => ({ ...f, [field]: e.target.value }))} />
                      </div>
                    </div>
                  ))}
                  <Button className="w-full bg-red-600 hover:bg-red-700" onClick={handleSavePassword} disabled={savingPw}>
                    {savingPw ? <><Loader2 className="mr-2 size-4 animate-spin" />Đang cập nhật...</> : 'Cập nhật mật khẩu'}
                  </Button>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="rounded-lg border bg-white p-6">
                <h2 className="mb-6 text-2xl font-bold">Cài đặt thông báo</h2>
                <div className="space-y-6">
                  {([
                    ['Thông báo đơn hàng', 'Nhận cập nhật khi trạng thái đơn hàng thay đổi.', true],
                    ['Khuyến mãi & ưu đãi', 'Nhận thông tin về mã giảm giá và chương trình mới.', true],
                    ['Sản phẩm mới', 'Nhận thông báo khi có laptop mới phù hợp nhu cầu.', false],
                    ['Email marketing', 'Nhận email tổng hợp về tin tức và sản phẩm.', false],
                    ['Thông báo SMS', 'Nhận SMS về đơn hàng và các mốc giao hàng.', true],
                  ] as [string, string, boolean][]).map(([title, desc, checked]) => (
                    <div key={title} className="flex items-center justify-between border-b py-4 last:border-b-0">
                      <div><h3 className="mb-1 font-semibold">{title}</h3><p className="text-sm text-gray-600">{desc}</p></div>
                      <input type="checkbox" defaultChecked={checked} className="size-4 accent-red-600" />
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Mục này hiện là giao diện tạm thời. Backend chưa có cấu hình lưu thông báo riêng.
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}