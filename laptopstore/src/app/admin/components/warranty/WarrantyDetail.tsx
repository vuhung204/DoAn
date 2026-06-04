// src/components/warranty/WarrantyDetail.tsx
import { useEffect, useState } from 'react';
import {
  ArrowLeft, User, Phone, Mail, Package,
  Wrench, CheckCircle, Clock, XCircle, AlertCircle,
} from 'lucide-react';
import { useWarranty } from '../../hooks/useWarranty';
import type { WarrantyStatus } from '../../api/warrantyApi';

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<WarrantyStatus, string> = {
  PENDING:   'Chờ xử lý',
  APPROVED:  'Đã tiếp nhận',
  IN_REPAIR: 'Đang sửa chữa',
  COMPLETED: 'Hoàn thành',
  REJECTED:  'Từ chối',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLORS: Record<WarrantyStatus, string> = {
  PENDING:   'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED:  'bg-blue-100 text-blue-800 border-blue-200',
  IN_REPAIR: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED:  'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
};

/** Trả về các trạng thái có thể chuyển sang từ trạng thái hiện tại */
function getAllowedTransitions(current: WarrantyStatus): WarrantyStatus[] {
  const map: Record<WarrantyStatus, WarrantyStatus[]> = {
    PENDING:   ['APPROVED', 'REJECTED'],
    APPROVED:  ['IN_REPAIR', 'REJECTED'],
    IN_REPAIR: ['COMPLETED'],
    COMPLETED: [],
    REJECTED:  [],
    CANCELLED: [],
  };
  return map[current] ?? [];
}

const TRANSITION_LABELS: Record<WarrantyStatus, string> = {
  APPROVED:  'Duyệt & Tiếp nhận máy',
  IN_REPAIR: 'Bắt đầu sửa chữa',
  COMPLETED: 'Hoàn thành – Trả máy',
  REJECTED:  'Từ chối yêu cầu',
  PENDING:   'Chờ xử lý',
  CANCELLED: 'Đã hủy',
};

const TRANSITION_COLORS: Partial<Record<WarrantyStatus, string>> = {
  APPROVED:  'bg-blue-600 hover:bg-blue-700 text-white',
  IN_REPAIR: 'bg-purple-600 hover:bg-purple-700 text-white',
  COMPLETED: 'bg-green-600 hover:bg-green-700 text-white',
  REJECTED:  'bg-red-500 hover:bg-red-600 text-white',
};

// Timeline steps
const TIMELINE_STEPS: { key: WarrantyStatus; label: string; icon: any }[] = [
  { key: 'PENDING',   label: 'Gửi yêu cầu',  icon: Clock   },
  { key: 'APPROVED',  label: 'Tiếp nhận',     icon: CheckCircle },
  { key: 'IN_REPAIR', label: 'Đang sửa',      icon: Wrench  },
  { key: 'COMPLETED', label: 'Hoàn thành',    icon: CheckCircle },
];
const STEP_ORDER: Partial<Record<WarrantyStatus, number>> = {
  PENDING: 0, APPROVED: 1, IN_REPAIR: 2, COMPLETED: 3,
};

function fmtDate(s: string | null | undefined): string {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface WarrantyDetailProps {
  warrantyId: number;
  onBack: () => void;
  showToast?: (msg: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WarrantyDetail({ warrantyId, onBack, showToast }: WarrantyDetailProps) {
  const { detail, loadingDetail, updating, loadDetail, updateStatus } = useWarranty();

  const [selectedStatus, setSelectedStatus] = useState<WarrantyStatus | ''>('');
  const [staffNote, setStaffNote]           = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!warrantyId) return;
    loadDetail(warrantyId)
      .then(d => {
        const allowed = getAllowedTransitions(d.status);
        setSelectedStatus(allowed.length ? allowed[0] : '');
        setStaffNote('');
        setRejectionReason('');
      })
      .catch(() => {});
  }, [warrantyId]);

  // Reset note fields when switching target status
  useEffect(() => {
    setStaffNote('');
    setRejectionReason('');
  }, [selectedStatus]);

  const handleUpdate = async () => {
    if (!detail || !selectedStatus) return;

    const allowed = getAllowedTransitions(detail.status);
    if (!allowed.includes(selectedStatus as WarrantyStatus)) {
      showToast?.('Chuyển trạng thái không hợp lệ');
      return;
    }

    if (selectedStatus === 'REJECTED' && !rejectionReason.trim()) {
      showToast?.('⚠️ Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      await updateStatus(warrantyId, {
        newStatus: selectedStatus as WarrantyStatus,
        staffNote: staffNote.trim() || undefined,
        rejectionReason: selectedStatus === 'REJECTED' ? rejectionReason.trim() : undefined,
      });
      // Reload detail to get fresh data
      const updated = await loadDetail(warrantyId);
      const newAllowed = getAllowedTransitions(updated.status);
      setSelectedStatus(newAllowed.length ? newAllowed[0] : '');
      setStaffNote('');
      setRejectionReason('');
      showToast?.(`✅ Đã cập nhật: ${STATUS_LABELS[selectedStatus as WarrantyStatus]}`);
    } catch (e: any) {
      showToast?.(`❌ Lỗi: ${e?.response?.data?.message ?? e?.message ?? 'Không thể cập nhật'}`);
    }
  };

  if (loadingDetail || !detail) {
    return (
      <div className="p-12 text-center text-gray-400">
        {loadingDetail ? 'Đang tải...' : 'Không tìm thấy yêu cầu bảo hành'}
      </div>
    );
  }

  const allowedNow    = getAllowedTransitions(detail.status);
  const currentStep   = STEP_ORDER[detail.status] ?? -1;
  const isTerminal    = detail.status === 'COMPLETED' || detail.status === 'REJECTED' || detail.status === 'CANCELLED';

  return (
    <div>
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-bold mb-4 transition-all hover:-translate-x-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách
      </button>

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Chi Tiết Bảo Hành</h1>
          <p className="text-blue-600 font-extrabold mt-1">Mã bảo hành: #{detail.warrantyId}</p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-extrabold border ${STATUS_COLORS[detail.status]}`}>
          {STATUS_LABELS[detail.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-5">

        {/* ── LEFT ─────────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Status timeline */}
          {!isTerminal || detail.status === 'COMPLETED' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 mb-5 pb-3 border-b border-gray-200">
                Tiến Trình Xử Lý
              </h3>
              <div className="flex items-start gap-0">
                {TIMELINE_STEPS.map((step, i) => {
                  const done   = i < currentStep;
                  const active = i === currentStep;
                  const Icon   = step.icon;
                  return (
                    <div key={step.key} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
                          ${done   ? 'bg-green-500 text-white'
                          : active ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                   : 'bg-gray-100 text-gray-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`mt-2 text-xs whitespace-nowrap font-semibold
                          ${done || active ? 'text-gray-800' : 'text-gray-400'}`}>
                          {step.label}
                        </span>
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div className={`h-0.5 w-16 mx-2 mb-5 ${i < currentStep ? 'bg-green-400' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              {detail.status === 'REJECTED' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700 font-semibold">Yêu cầu đã bị từ chối</span>
                </div>
              )}
            </div>
          ) : null}

          {/* Issue description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 mb-4 pb-3 border-b border-gray-200">
              Mô Tả Vấn Đề (Từ Khách Hàng)
            </h3>
            <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-lg p-4">
              {detail.issueDescription}
            </p>
          </div>

          {/* Staff note — shown if exists */}
          {detail.staffNote && (
            <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-700 mb-4 pb-3 border-b border-blue-100">
                Ghi Chú Kỹ Thuật
              </h3>
              <p className="text-sm text-gray-800 leading-relaxed bg-blue-50 rounded-lg p-4">
                {detail.staffNote}
              </p>
            </div>
          )}

          {/* Rejection reason — shown if rejected */}
          {detail.rejectionReason && (
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-red-600 mb-4 pb-3 border-b border-red-100">
                Lý Do Từ Chối
              </h3>
              <p className="text-sm text-gray-800 leading-relaxed bg-red-50 rounded-lg p-4">
                {detail.rejectionReason}
              </p>
            </div>
          )}

          {/* Product info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 mb-4 pb-3 border-b border-gray-200 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Sản Phẩm Bảo Hành
            </h3>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-gray-900">{detail.productName}</p>
                <p className="text-xs text-gray-500 mt-0.5">Số lượng: {detail.quantity}</p>
                <p className="text-xs text-gray-500">Đơn hàng: <span className="text-blue-600 font-semibold">{detail.orderCode}</span></p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 mb-4 pb-3 border-b border-gray-200">
              Mốc Thời Gian
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <TimeStampItem label="Ngày tạo yêu cầu" value={fmtDate(detail.createdAt)} />
              <TimeStampItem label="Ngày xử lý"       value={fmtDate(detail.processedAt)} />
              <TimeStampItem label="Ngày hoàn thành"  value={fmtDate(detail.completedAt)} highlight={!!detail.completedAt} />
              <TimeStampItem label="Cập nhật lần cuối" value={fmtDate(detail.updatedAt)} />
            </div>
          </div>
        </div>

        {/* ── RIGHT ────────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Update status panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 mb-4 pb-3 border-b border-gray-200">
              Cập Nhật Trạng Thái
            </h3>

            {/* Current status */}
            <div className={`border rounded-xl p-4 mb-4 ${STATUS_COLORS[detail.status]}`}>
              <div className="text-xs font-extrabold uppercase tracking-wider opacity-70 mb-1">
                Trạng thái hiện tại
              </div>
              <div className="text-base font-extrabold">
                {STATUS_LABELS[detail.status]}
              </div>
            </div>

            {isTerminal ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Yêu cầu này đã kết thúc, không thể thay đổi trạng thái.
              </div>
            ) : (
              <>
                {/* Transition buttons */}
                <div className="space-y-2 mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Chuyển sang:
                  </label>
                  {allowedNow.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedStatus(s)}
                      className={`w-full px-4 py-2.5 rounded-lg text-sm font-bold border-2 transition-all
                        ${selectedStatus === s
                          ? `${TRANSITION_COLORS[s]} border-transparent shadow-sm`
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}
                    >
                      {TRANSITION_LABELS[s]}
                    </button>
                  ))}
                </div>

                {/* Staff note textarea */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Ghi chú kỹ thuật
                    {selectedStatus !== 'REJECTED' && <span className="text-gray-400 ml-1">(tùy chọn)</span>}
                  </label>
                  <textarea
                    value={staffNote}
                    onChange={e => setStaffNote(e.target.value)}
                    rows={3}
                    placeholder={
                      selectedStatus === 'APPROVED'  ? 'Kết quả kiểm tra ban đầu...'
                    : selectedStatus === 'IN_REPAIR' ? 'Linh kiện cần thay, công việc đang thực hiện...'
                    : selectedStatus === 'COMPLETED' ? 'Tóm tắt công việc đã làm, kết quả sửa chữa...'
                    : 'Ghi chú kỹ thuật...'
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Rejection reason — only show when REJECTED selected */}
                {selectedStatus === 'REJECTED' && (
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-red-600 mb-1.5">
                      Lý do từ chối <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      rows={3}
                      placeholder="Vd: Hết thời hạn bảo hành, lỗi do người dùng..."
                      className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>
                )}

                <button
                  onClick={handleUpdate}
                  disabled={
                    updating ||
                    !selectedStatus ||
                    (selectedStatus === 'REJECTED' && !rejectionReason.trim())
                  }
                  className={`w-full mt-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    ${selectedStatus ? (TRANSITION_COLORS[selectedStatus as WarrantyStatus] ?? 'bg-blue-600 hover:bg-blue-700 text-white') : 'bg-gray-300 text-gray-600'}`}
                >
                  {updating ? 'Đang cập nhật...' : `Xác nhận: ${selectedStatus ? TRANSITION_LABELS[selectedStatus as WarrantyStatus] : '—'}`}
                </button>
              </>
            )}
          </div>

          {/* Customer info */}
          <InfoCard title="Thông Tin Khách Hàng" icon={<User className="w-4 h-4 text-blue-600" />}>
            <InfoRow icon={User}  label="Tên khách"    value={detail.customerName}  />
            <InfoRow icon={Phone} label="Điện thoại"   value={detail.customerPhone} />
            <InfoRow icon={Mail}  label="Email"        value={detail.customerEmail} />
          </InfoCard>

          {/* Handler info */}
          <InfoCard title="Người Xử Lý" icon={<Wrench className="w-4 h-4 text-purple-600" />}>
            <InfoRow
              icon={User}
              label="Staff"
              value={detail.handledByName ?? '—'}
              muted={!detail.handledByName}
              mutedText="Chưa phân công"
            />
          </InfoCard>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TimeStampItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-green-50' : 'bg-gray-50'}`}>
      <p className={`text-[11px] font-bold mb-1 ${highlight ? 'text-green-600' : 'text-gray-400'}`}>{label}</p>
      <p className={`font-semibold text-sm ${highlight ? 'text-green-700' : 'text-gray-700'}`}>{value}</p>
    </div>
  );
}

function InfoCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 mb-4 pb-3 border-b border-gray-200 flex items-center gap-2">
        {icon}{title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, muted, mutedText }: {
  icon: any; label: string; value?: string | null; muted?: boolean; mutedText?: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
      <Icon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-0.5">{label}</div>
        {muted
          ? <div className="text-sm text-gray-400 italic">{mutedText ?? '—'}</div>
          : <div className="font-semibold text-gray-900 text-sm">{value || '—'}</div>
        }
      </div>
    </div>
  );
}