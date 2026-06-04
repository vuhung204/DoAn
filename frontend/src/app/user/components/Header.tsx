import {
  useState,
  useRef,
  useEffect,
} from 'react';

import {
  ShoppingCart,
  User,
  Search,
  Menu,
  Phone,
  Package,
  Tag,
  Newspaper,
  ChevronDown,
  ChevronRight,
  Laptop,
  LogIn,
  LogOut,
  X,
  Loader2,
} from 'lucide-react';

import { Button }    from './ui/button';
import { Input }     from './ui/input';
import { Link, useNavigate } from 'react-router';
import { useAuth }   from '../context/AuthContext';
import api           from '../api/api';

import NotificationBell  from './NotificationBell';
import { useNotifications } from '../hook/useNotifications';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CategoryResponse {
  id: number; name: string; slug: string;
  parentId: number | null; sortOrder: number;
  isActive: boolean; children: CategoryResponse[];
}

interface SearchSuggestion {
  id: number; name: string; slug: string;
  brandName: string; categoryName: string;
  price: number; imageUrl: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: number) { return price.toLocaleString('vi-VN') + '₫'; }

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}

// ── SearchBar ─────────────────────────────────────────────────────────────────

function SearchBar() {
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [open,        setOpen]        = useState(false);

  const wrapperRef     = useRef<HTMLDivElement>(null);
  const navigate       = useNavigate();
  const debouncedQuery = useDebounce(query, 280);

  useClickOutside(wrapperRef, () => setOpen(false));

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    let cancelled = false;
    setLoading(true);
    api.get<SearchSuggestion[]>('/products/suggestions', { params: { q, limit: 8 } })
      .then(res => { if (!cancelled) { setSuggestions(res.data); setOpen(res.data.length > 0); } })
      .catch(() => { if (!cancelled) setSuggestions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const goSearch = (q: string) => { setOpen(false); navigate(`/products?keyword=${encodeURIComponent(q)}`); };

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-2xl">
      <form onSubmit={e => { e.preventDefault(); if (query.trim()) goSearch(query.trim()); }} className="relative">
        <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors">
          <Search className="size-5" />
        </button>
        <Input
          type="text" autoComplete="off"
          placeholder="Tìm kiếm laptop, thương hiệu..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          className="h-11 w-full rounded-xl border-gray-200 bg-gray-50 pl-11 pr-12 text-sm shadow-none transition-all duration-200 focus:bg-white focus:border-red-300 focus:ring-4 focus:ring-red-100"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading
            ? <Loader2 className="size-4 animate-spin text-gray-400" />
            : query
              ? <button type="button" onClick={() => { setQuery(''); setSuggestions([]); setOpen(false); }}><X className="size-4 text-gray-400 hover:text-gray-700" /></button>
              : <kbd className="hidden sm:flex h-5 items-center rounded border border-gray-200 bg-white px-1.5 text-[10px] text-gray-400">⌘K</kbd>
          }
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl z-50">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50">
            <span className="text-xs text-gray-500">
              {suggestions.length} kết quả cho <span className="font-semibold text-red-600">"{query}"</span>
            </span>
            <button onClick={() => goSearch(query.trim())} className="text-xs font-medium text-red-600 hover:text-red-700">Xem tất cả</button>
          </div>
          <ul className="divide-y divide-gray-100">
            {suggestions.map(s => (
              <li key={s.id}>
                <button
                  onClick={() => { setOpen(false); setQuery(''); navigate(`/product/${s.id}`); }}
                  className="group flex w-full items-center gap-4 px-4 py-3 text-left transition-all hover:bg-red-50"
                >
                  <div className="size-14 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 flex-shrink-0">
                    {s.imageUrl
                      ? <img src={s.imageUrl} alt={s.name} className="size-full object-cover" />
                      : <div className="size-full flex items-center justify-center text-gray-400 font-bold">{s.brandName[0]}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 group-hover:text-red-600">{s.name}</p>
                    <p className="mt-1 truncate text-xs text-gray-500">{s.brandName} · {s.categoryName}</p>
                  </div>
                  <div className="flex-shrink-0 text-sm font-bold text-red-600">{formatPrice(s.price)}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── CategoryMenu ──────────────────────────────────────────────────────────────

function CategoryMenu({ roots }: { roots: CategoryResponse[] }) {
  const [open,       setOpen]       = useState(false);
  const [activeItem, setActiveItem] = useState<CategoryResponse | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => { setOpen(false); setActiveItem(null); });
  useEffect(() => { if (!open) setActiveItem(null); }, [open]);

  const laptopRoot = roots.find(r => r.slug === 'laptop');
  const menuItems  = (laptopRoot ? laptopRoot.children : roots).filter(c => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const activeSubs = activeItem ? activeItem.children.filter(c => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder) : [];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md"
      >
        <Menu className="size-4" />
        <span className="hidden sm:block">Danh mục</span>
        <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-3 flex overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" style={{ minWidth: activeSubs.length > 0 ? '780px' : '260px' }}>
          <nav className="w-64 border-r border-gray-100 py-2 max-h-[500px] overflow-y-auto">
            {menuItems.map(cat => {
              const isHovered = activeItem?.id === cat.id;
              const hasSub    = cat.children?.some(c => c.isActive);
              return (
                <Link key={cat.id} to={`/products?categoryId=${cat.id}`} onClick={() => setOpen(false)}
                  onMouseEnter={() => setActiveItem(hasSub ? cat : null)}
                  className={`flex items-center justify-between px-4 py-3 text-sm transition-all ${isHovered ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-red-50 hover:text-red-600'}`}
                >
                  <div className="flex items-center gap-3"><Laptop className="size-4 opacity-60" /><span>{cat.name}</span></div>
                  {hasSub && <ChevronRight className="size-4 text-gray-400" />}
                </Link>
              );
            })}
          </nav>
          {activeSubs.length > 0 && (
            <div className="flex-1 bg-white p-6 max-h-[500px] overflow-y-auto">
              <p className="mb-5 border-b border-red-100 pb-3 text-xs font-semibold uppercase tracking-wide text-red-600">{activeItem?.name}</p>
              <div className="grid grid-cols-3 gap-3">
                {activeSubs.map(sub => (
                  <Link key={sub.id} to={`/products?categoryId=${sub.id}`} onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-all hover:bg-red-50 hover:text-red-600">
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

export function Header() {
  const [showUserMenu,  setShowUserMenu]  = useState(false);
  const [categoryRoots, setCategoryRoots] = useState<CategoryResponse[]>([]);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate    = useNavigate();

  const { userLoggedIn, userFullName, logout, cartCount } = useAuth();

  // ✅ Lấy onDropdownOpen / onDropdownClose thay vì fetchList
  const notif = useNotifications(userLoggedIn);

  useClickOutside(userMenuRef, () => setShowUserMenu(false));

  useEffect(() => {
    api.get<CategoryResponse[]>('/categories').then(res => setCategoryRoots(res.data)).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); setShowUserMenu(false); navigate('/'); };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex h-16 items-center gap-5">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="hidden sm:block text-xl font-bold tracking-tight text-gray-900">Laptop Store</span>
            </Link>

            <SearchBar />

            <div className="ml-auto flex items-center gap-2">
              {userLoggedIn ? (
                <div ref={userMenuRef} className="relative flex items-center gap-2">

                  {/* ✅ Truyền onDropdownOpen / onDropdownClose */}
                  <NotificationBell
                    items={notif.items}
                    unread={notif.unread}
                    loading={notif.loading}
                    hasMore={notif.hasMore}
                    onDropdownOpen={notif.onDropdownOpen}
                    onDropdownClose={notif.onDropdownClose}
                    loadMore={notif.loadMore}
                    markAllRead={notif.markAllRead}
                    markOneRead={notif.markOneRead}
                  />

                  {/* Cart */}
                  <Link to="/cart">
                    <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-red-50">
                      <ShoppingCart className="size-5 text-gray-700" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                          {cartCount > 99 ? '99+' : cartCount}
                        </span>
                      )}
                    </Button>
                  </Link>

                  {/* User */}
                  <button onClick={() => setShowUserMenu(v => !v)} className="flex items-center gap-3 rounded-xl px-3 py-2 transition-all hover:bg-red-50">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 font-semibold text-white">
                      {userFullName ? userFullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs text-gray-400">Xin chào</p>
                      <p className="max-w-[120px] truncate text-sm font-semibold text-gray-900">{userFullName}</p>
                    </div>
                    <ChevronDown className={`size-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-3 w-60 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl z-50">
                      <div className="border-b border-gray-100 p-4">
                        <p className="text-sm text-gray-500">Đăng nhập với</p>
                        <p className="truncate font-semibold text-gray-900">{userFullName}</p>
                      </div>
                      <div className="p-2">
                        <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-700 transition-all hover:bg-red-50 hover:text-red-600">
                          <User className="size-4" />Trang cá nhân
                        </Link>
                        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-600 transition-all hover:bg-red-50">
                          <LogOut className="size-4" />Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/register"><Button variant="ghost" className="rounded-xl hover:bg-red-50 hover:text-red-600">Đăng ký</Button></Link>
                  <Link to="/login"><Button className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 shadow-sm hover:shadow-md"><LogIn className="size-4 mr-2" />Đăng nhập</Button></Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* NAVBAR */}
      <div className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <nav className="flex h-14 items-center gap-2">
            <CategoryMenu roots={categoryRoots} />
            {[
              { icon: Phone,     label: 'Bán hàng trực tuyến' },
              { icon: Package,   label: 'Trả góp 0%'          },
              { icon: Tag,       label: 'Khuyến mại'          },
              { icon: Newspaper, label: 'Tin tức'             },
            ].map(({ icon: Icon, label }) => (
              <Link key={label} to="#" className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-gray-600 transition-all hover:bg-red-50 hover:text-red-600">
                <Icon className="size-4" />
                <span className="hidden lg:block">{label}</span>
              </Link>
            ))}
            <div className="ml-auto hidden md:flex">
              <div className="rounded-full bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">🔥 DEAL GIÁ SỐC</div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}