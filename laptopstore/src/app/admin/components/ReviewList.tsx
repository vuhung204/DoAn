// src/components/ReviewList.tsx
import { useState, useEffect, useCallback } from 'react';
import { Search, Star, Check, EyeOff, Reply, Trash2, Image as ImageIcon, Inbox, Loader2, X } from 'lucide-react';
import {
  fetchReviews, updateReviewStatus, replyReview, deleteReview,
  type ReviewListDto,
} from '../api/reviewsApi';

// BE trả UPPERCASE — map sang label/class cho UI
const statusLabels: Record<string, string> = {
  PENDING:  'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  HIDDEN:   'Bị ẩn',
};

const statusClasses: Record<string, string> = {
  PENDING:  'bg-orange-100 text-orange-700',
  APPROVED: 'bg-green-100 text-green-700',
  HIDDEN:   'bg-red-100 text-red-700',
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

// ── Reply Modal ────────────────────────────────────────────────────────────
function ReplyModal({
  reviewId, onClose, onSaved,
}: { reviewId: number; onClose: () => void; onSaved: () => void }) {
  const [text,   setText]   = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSubmit = async () => {
    if (!text.trim()) { setError('Vui lòng nhập nội dung phản hồi'); return; }
    setSaving(true);
    try {
      await replyReview(reviewId, text.trim());
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Gửi phản hồi thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-[92%] max-w-[480px] shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-gray-900">Phản hồi đánh giá</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <textarea
          value={text} onChange={e => { setText(e.target.value); setError(''); }}
          rows={4} placeholder="Nhập nội dung phản hồi..."
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50 resize-none"
          autoFocus
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        <div className="flex gap-2.5 mt-4">
          <button onClick={onClose} className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">Huỷ</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 px-3 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Reply className="w-4 h-4" />}
            Gửi phản hồi
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export function ReviewList() {
  const [reviews,      setReviews]      = useState<ReviewListDto[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [totalElements, setTotal]       = useState(0);
  const [totalPages,   setTotalPages]   = useState(1);
  const [page,         setPage]         = useState(0);

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  const [replyModalId, setReplyModalId] = useState<number | null>(null);
  const [toast,        setToast]        = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchReviews({
        page,
        size:   20,
        q:      search    || undefined,
        status: statusFilter || undefined,
        rating: ratingFilter ? Number(ratingFilter) : undefined,
      });
      setReviews(result.content);
      setTotal(result.totalElements);
      setTotalPages(result.totalPages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, ratingFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [search, statusFilter, ratingFilter]);

  const handleApprove = async (id: number) => {
    try { await updateReviewStatus(id, 'APPROVED'); showToast('✅ Đánh giá đã được duyệt'); load(); }
    catch { showToast('❌ Thao tác thất bại'); }
  };

  const handleHide = async (id: number) => {
    try { await updateReviewStatus(id, 'HIDDEN'); showToast('🙈 Đánh giá đã bị ẩn'); load(); }
    catch { showToast('❌ Thao tác thất bại'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn chắc chắn muốn xóa đánh giá này?')) return;
    try { await deleteReview(id); showToast('🗑️ Đã xóa đánh giá'); load(); }
    catch { showToast('❌ Xóa thất bại'); }
  };

  return (
    <>
      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] px-3 py-2 border border-gray-300 rounded-lg bg-white">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Tìm sản phẩm, khách hàng..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 text-[13px] outline-none bg-transparent" />
        </div>

        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-[11px] font-bold text-gray-600 uppercase">Trạng thái</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 border border-gray-300 rounded-lg text-[13px] bg-white">
            <option value="">Tất cả</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="HIDDEN">Bị ẩn</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-[11px] font-bold text-gray-600 uppercase">Sao</label>
          <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}
            className="px-2.5 py-2 border border-gray-300 rounded-lg text-[13px] bg-white">
            <option value="">Tất cả</option>
            {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} sao</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-[13px]">Đang tải...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Không tìm thấy đánh giá nào</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <div className="flex-1 min-w-[250px]">
                  <div className="text-sm font-black text-gray-900 mb-1">{review.productName}</div>
                  <div className="text-xs text-gray-500">{review.customerName} • {review.email}</div>
                  <div className="flex gap-1 mt-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'}`} />
                    ))}
                  </div>
                </div>
                {/* status UPPERCASE từ BE */}
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${statusClasses[review.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {statusLabels[review.status] ?? review.status}
                </span>
              </div>

              {/* Meta */}
              <div className="flex gap-3 mb-2 flex-wrap text-[11px] text-gray-500">
                {/* createdAt từ BE (ISO string) */}
                <div><span className="font-bold text-gray-600">Ngày:</span> {formatDate(review.createdAt)}</div>
                {/* imageCount từ BE */}
                {review.imageCount > 0 && (
                  <div><span className="font-bold text-gray-600">Ảnh:</span> {review.imageCount}</div>
                )}
              </div>

              {/* Content */}
              <div className="mb-3 pb-3 border-b border-gray-200">
                {review.title && <div className="text-[13px] font-bold text-gray-900 mb-1.5">{review.title}</div>}
                {/* shortText từ BE */}
                <div className="text-[13px] text-gray-700 leading-relaxed">{review.shortText}</div>
                {review.imageCount > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {Array.from({ length: Math.min(review.imageCount, 5) }, (_, i) => (
                      <div key={i} className="w-[60px] h-[60px] bg-gray-100 rounded flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {review.status !== 'APPROVED' && (
                  <button onClick={() => handleApprove(review.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded text-xs font-semibold hover:bg-green-200 transition-colors">
                    <Check className="w-3.5 h-3.5" />Duyệt
                  </button>
                )}
                {review.status !== 'HIDDEN' && (
                  <button onClick={() => handleHide(review.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded text-xs font-semibold hover:bg-orange-200 transition-colors">
                    <EyeOff className="w-3.5 h-3.5" />Ẩn
                  </button>
                )}
                <button onClick={() => setReplyModalId(review.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200 transition-colors">
                  <Reply className="w-3.5 h-3.5" />Phản hồi
                </button>
                <button onClick={() => handleDelete(review.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-500">{totalElements} đánh giá · Trang {page + 1}/{totalPages}</span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold disabled:opacity-40 hover:border-blue-600 hover:text-blue-600 transition-colors">Trước</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold disabled:opacity-40 hover:border-blue-600 hover:text-blue-600 transition-colors">Sau</button>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyModalId !== null && (
        <ReplyModal
          reviewId={replyModalId}
          onClose={() => setReplyModalId(null)}
          onSaved={() => { load(); showToast('✅ Đã gửi phản hồi'); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-2.5 rounded-full text-sm font-semibold z-50 animate-in fade-in">
          {toast}
        </div>
      )}
    </>
  );
}