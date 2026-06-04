// components/NotificationBell.tsx
import { useEffect, useRef, useState } from 'react';
import {
  Bell, Package, RotateCcw, CheckCircle,
  ChevronDown, X, BellOff, Wrench,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import type { NotificationItem } from '../hook/useNotifications';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

const TYPE_META: Record<string, { icon: typeof Package; color: string; bg: string }> = {
  ORDER_STATUS:     { icon: Package,     color: 'text-blue-600',   bg: 'bg-blue-100'   },
  RETURN_STATUS:    { icon: RotateCcw,   color: 'text-orange-500', bg: 'bg-orange-100' },
  REFUND_COMPLETED: { icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-100'  },
  WARRANTY_STATUS:  { icon: Wrench,      color: 'text-purple-600', bg: 'bg-purple-100' },
  PAYMENT_SUCCESS:  { icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-100'  },
  PAYMENT_FAILED:   { icon: Package,     color: 'text-red-500',    bg: 'bg-red-100'    },
};

// ── Single item ───────────────────────────────────────────────────────────────

function NotifItem({
  item,
  onRead,
  onClose,
}: {
  item:    NotificationItem;
  onRead:  (id: number) => void;
  // ✅ onClose giờ là optional — chỉ đóng dropdown khi navigate
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const meta = TYPE_META[item.type] ?? {
    icon: Bell, color: 'text-gray-500', bg: 'bg-gray-100',
  };
  const Icon = meta.icon;

  const handleClick = () => {
    // ✅ Mark read mà không đóng dropdown
    if (!item.isRead) onRead(item.id);

    // ✅ Chỉ đóng dropdown và navigate khi có referenceId
    if (!item.referenceId) return;

    onClose(); // đóng dropdown trước khi navigate
    switch (item.referenceType) {
      case 'ORDER':
        navigate(`/order-success?orderId=${item.referenceId}`);
        break;
      case 'RETURN':
        navigate('/profile?tab=returns');
        break;
      case 'WARRANTY':
        navigate('/warranty');
        break;
      default:
        break;
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full text-left flex gap-3 px-4 py-3.5
        transition-colors duration-150
        border-b border-gray-100 last:border-0
        hover:bg-gray-50/80
        ${!item.isRead ? 'bg-blue-50/40' : 'bg-white'}
      `}
    >
      {/* Icon bubble */}
      <div className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full mt-0.5 ${meta.bg}`}>
        <Icon className={`w-4 h-4 ${meta.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-sm leading-snug ${!item.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
          {item.title}
        </p>
        {item.body && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
            {item.body}
          </p>
        )}
        <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
          {fmtRelative(item.createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {!item.isRead && (
        <div className="flex-shrink-0 flex items-start pt-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-blue-100" />
        </div>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface NotificationBellProps {
  items:           NotificationItem[];
  unread:          number;
  loading:         boolean;
  hasMore:         boolean;
  onDropdownOpen:  () => void;  // ✅ đổi tên
  onDropdownClose: () => void;  // ✅ thêm mới
  loadMore:        () => void;
  markAllRead:     () => void;
  markOneRead:     (id: number) => void;
}

export default function NotificationBell({
  items, unread, loading, hasMore,
  onDropdownOpen, onDropdownClose,
  loadMore, markAllRead, markOneRead,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click outside — đóng dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (open) {
          setOpen(false);
          onDropdownClose();
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onDropdownClose]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      onDropdownOpen();  // ✅ fetch + start polling
    } else {
      onDropdownClose(); // ✅ stop polling
    }
  };

  const handleClose = () => {
    setOpen(false);
    onDropdownClose();
  };

  return (
    <div ref={ref} className="relative">

      {/* Bell button */}
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-red-50 transition-colors duration-150"
        aria-label="Thông báo"
      >
        <Bell className="size-5 text-gray-700" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none ring-2 ring-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-[360px] sm:w-[400px] bg-white rounded-2xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.18)] border border-gray-200/80 z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-gray-900 text-sm">Thông báo</h3>
              {unread > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {unread} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 font-semibold hover:text-blue-800 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Đọc tất cả
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-gray-200/70 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[440px] overflow-y-auto overscroll-contain">
            {loading && items.length === 0 ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-0.5">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="py-14 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <BellOff className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">Chưa có thông báo nào</p>
              </div>
            ) : (
              <>
                {items.map(item => (
                  <NotifItem
                    key={item.id}
                    item={item}
                    onRead={markOneRead}
                    onClose={handleClose}
                  />
                ))}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-1.5 py-3.5 text-sm text-blue-600 font-semibold hover:bg-blue-50 transition-colors border-t border-gray-100 disabled:opacity-50"
                  >
                    <ChevronDown className="w-4 h-4" />
                    {loading ? 'Đang tải...' : 'Xem thêm'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}