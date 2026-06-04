// import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import {
//   deleteReview,
//   exportReviews,
//   fetchReviews,
//   fetchReviewStats,
//   replyReview,
//   updateReviewStatus,
//   type PageDto,
//   type ReviewListDto,
//   type ReviewStatsDto,
//   type ReviewStatus,
// } from '../api/reviewsApi';

// const PAGE_SIZE = 20;

// export function useReviews() {
//   // Filters
//   const [q, setQ] = useState('');
//   const [status, setStatus] = useState<ReviewStatus | ''>('');
//   const [rating, setRating] = useState<number | ''>('');
//   const [page, setPage] = useState(0);

//   // Data
//   const [stats, setStats] = useState<ReviewStatsDto[]>([]);
//   const [data, setData] = useState<PageDto<ReviewListDto> | null>(null);

//   // Loading
//   const [listLoading, setListLoading] = useState(false);
//   const [statsLoading, setStatsLoading] = useState(false);
//   const [actionLoading, setActionLoading] = useState(false);

//   // Toast (simple)
//   const [toast, setToast] = useState('');
//   const [toastVisible, setToastVisible] = useState(false);
//   const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   const showToast = (msg: string) => {
//     if (toastRef.current) clearTimeout(toastRef.current);
//     setToast(msg);
//     setToastVisible(true);
//     toastRef.current = setTimeout(() => setToastVisible(false), 2800);
//   };

//   const loadList = useCallback(async () => {
//     setListLoading(true);
//     try {
//       const resp = await fetchReviews({
//         q: q || undefined,
//         status: (status || undefined) as ReviewStatus | undefined,
//         rating: rating === '' ? undefined : rating,
//         page,
//         size: PAGE_SIZE,
//         sort: 'createdAt',
//         direction: 'desc',
//       });
//       setData(resp);
//     } catch (e) {
//       showToast('❌ ' + extractMsg(e));
//     } finally {
//       setListLoading(false);
//     }
//   }, [q, status, rating, page]);

//   const loadStats = useCallback(async () => {
//     setStatsLoading(true);
//     try {
//       const resp = await fetchReviewStats();
//       setStats(resp);
//     } catch (e) {
//       showToast('❌ ' + extractMsg(e));
//     } finally {
//       setStatsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadList();
//   }, [loadList]);

//   useEffect(() => {
//     loadStats();
//   }, [loadStats]);

//   const refresh = useCallback(() => {
//     loadList();
//     loadStats();
//   }, [loadList, loadStats]);

//   // Actions
//   const handleApprove = useCallback(
//     async (id: number) => {
//       setActionLoading(true);
//       try {
//         await updateReviewStatus(id, { status: 'APPROVED' });
//         showToast('✅ Đã duyệt đánh giá');
//         refresh();
//       } catch (e) {
//         showToast('❌ ' + extractMsg(e));
//       } finally {
//         setActionLoading(false);
//       }
//     },
//     [refresh],
//   );

//   const handleHide = useCallback(
//     async (id: number) => {
//       setActionLoading(true);
//       try {
//         await updateReviewStatus(id, { status: 'HIDDEN' });
//         showToast('⏸️ Đã ẩn đánh giá');
//         refresh();
//       } catch (e) {
//         showToast('❌ ' + extractMsg(e));
//       } finally {
//         setActionLoading(false);
//       }
//     },
//     [refresh],
//   );

//   const handleReply = useCallback(
//     async (id: number) => {
//       const replyText = prompt('Nhập phản hồi:');
//       if (!replyText) return;

//       setActionLoading(true);
//       try {
//         await replyReview(id, { replyText });
//         showToast('💬 Đã gửi phản hồi');
//         refresh();
//       } catch (e) {
//         showToast('❌ ' + extractMsg(e));
//       } finally {
//         setActionLoading(false);
//       }
//     },
//     [refresh],
//   );

//   const handleDelete = useCallback(
//     async (id: number) => {
//       if (!confirm('Bạn chắc chắn muốn xóa đánh giá này?')) return;
//       setActionLoading(true);
//       try {
//         await deleteReview(id);
//         showToast('🗑️ Đã xóa đánh giá');
//         refresh();
//       } catch (e) {
//         showToast('❌ ' + extractMsg(e));
//       } finally {
//         setActionLoading(false);
//       }
//     },
//     [refresh],
//   );

//   const handleExport = useCallback(async (format: 'XLSX' | 'CSV' = 'XLSX') => {
//     try {
//       await exportReviews({
//         format,
//         status: (status || undefined) as ReviewStatus | undefined,
//         rating: rating === '' ? undefined : rating,
//       });
//       showToast('📥 Đang tải file');
//     } catch (e) {
//       showToast('❌ ' + extractMsg(e));
//     }
//   }, [status, rating]);

//   const reviews = data?.content ?? [];
//   const totalElements = data?.totalElements ?? 0;
//   const totalPages = data?.totalPages ?? 0;

//   const canPrev = page > 0;
//   const canNext = totalPages > 0 && page < totalPages - 1;

//   const setStatusFilter = (s: ReviewStatus | '') => {
//     setPage(0);
//     setStatus(s);
//   };

//   const setRatingFilter = (r: number | '') => {
//     setPage(0);
//     setRating(r);
//   };

//   const setQFilter = (next: string) => {
//     setPage(0);
//     setQ(next);
//   };

//   const ratingDistribution = useMemo(() => {
//     const totalCard = stats.find((x) => x.label.toLowerCase().includes('tổng'));
//     return totalCard?.ratingDistribution ?? null;
//   }, [stats]);

//   return {
//     // filters
//     q,
//     setQ: setQFilter,
//     status,
//     setStatus: setStatusFilter,
//     rating,
//     setRating: setRatingFilter,
//     page,
//     setPage,

//     // data
//     stats,
//     ratingDistribution,
//     reviews,
//     totalElements,
//     totalPages,

//     // loading
//     listLoading,
//     statsLoading,
//     actionLoading,

//     // actions
//     refresh,
//     handleApprove,
//     handleHide,
//     handleReply,
//     handleDelete,
//     handleExport,

//     // toast
//     toast,
//     toastVisible,
//     hideToast: () => setToastVisible(false),

//     // paging helpers
//     canPrev,
//     canNext,
//   };
// }

// function extractMsg(e: unknown): string {
//   if (e && typeof e === 'object') {
//     const ae = e as { response?: { data?: { message?: string } }; message?: string };
//     return ae.response?.data?.message ?? ae.message ?? 'Lỗi không xác định';
//   }
//   return String(e);
// }