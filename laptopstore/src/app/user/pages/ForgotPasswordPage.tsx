import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Mail, Lock, KeyRound, ArrowLeft, Laptop,
  Loader2, CheckCircle, Eye, EyeOff, RefreshCw,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'email' | 'otp' | 'password' | 'done';

const API = `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:9765/api'}/auth`;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Có lỗi xảy ra');
  return data as T;
}

// ── OTP Input ─────────────────────────────────────────────────────────────────

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      (document.getElementById(`otp-${i - 1}`) as HTMLInputElement)?.focus();
    }
  };

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = digit;
    onChange(next.join(''));
    if (digit && i < 5) {
      (document.getElementById(`otp-${i + 1}`) as HTMLInputElement)?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) { onChange(pasted); e.preventDefault(); }
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl
            transition-all outline-none
            ${d ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}
            focus:border-red-500 focus:bg-white focus:shadow-md`}
        />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  console.log('ForgotPasswordPage rendered');

  const [step, setStep]           = useState<Step>('email');
  const [email, setEmail]         = useState('');
  const [otp, setOtp]             = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (step === 'otp') {
      startCountdown(60);
    }
  }, [step]);

  // ── Countdown timer (resend OTP) ──────────────────────────────────────────
  const startCountdown = (secs = 60) => {
    setCountdown(secs);
    const id = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(id); return 0; } return c - 1; });
    }, 1000);
  };

  // ── Step 1: Gửi OTP ───────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setError('');
    if (!email.trim()) { setError('Vui lòng nhập email.'); return; }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) { setError('Email không hợp lệ.'); return; }

    setLoading(true);
    try {
      await post('/forgot-password', { email: email.trim() });
      setStep('otp');
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return;
    setError(''); setOtp('');
    setLoading(true);
    try {
      await post('/forgot-password', { email });
      startCountdown(60);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    setError('');
    if (otp.length < 6) { setError('Vui lòng nhập đủ 6 chữ số.'); return; }

    setLoading(true);
    try {
      const data = await post<{ resetToken: string }>('/verify-otp', { email, otp });
      setResetToken(data.resetToken);
      setStep('password');
    } catch (e: any) {
      setError(e.message);
      setOtp('');
    } finally { setLoading(false); }
  };

  // ── Step 3: Reset Password ────────────────────────────────────────────────
  const handleResetPassword = async () => {
    setError('');
    if (newPassword.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự.'); return; }
    if (newPassword !== confirmPw) { setError('Xác nhận mật khẩu chưa khớp.'); return; }

    setLoading(true);
    try {
      await post('/reset-password', { email, resetToken, newPassword });
      setStep('done');
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  // ── Step indicator ────────────────────────────────────────────────────────
  const STEPS = ['Email', 'Mã OTP', 'Mật khẩu mới'];
  const stepIdx = step === 'email' ? 0 : step === 'otp' ? 1 : 2;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4 py-8">
      {/* Decoration */}
      <div className="fixed top-[-100px] right-[-100px] w-96 h-96 bg-red-400 rounded-full opacity-10 pointer-events-none" />
      <div className="fixed bottom-[50px] left-[-50px] w-72 h-72 border-4 border-red-400 rounded-3xl opacity-10 pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10 relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-full mb-4 shadow-lg">
            <Laptop className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu</h1>
          <p className="text-sm text-gray-500 mt-1">Đặt lại mật khẩu tài khoản LaptopShop</p>
        </div>

        {/* Step indicator — ẩn khi done */}
        {step !== 'done' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all
                  ${i < stepIdx ? 'bg-green-500 text-white'
                    : i === stepIdx ? 'bg-red-600 text-white ring-4 ring-red-100'
                    : 'bg-gray-200 text-gray-400'}`}>
                  {i < stepIdx ? <CheckCircle className="size-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === stepIdx ? 'text-red-600' : 'text-gray-400'}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 ${i < stepIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-700 border-l-4 border-red-500">
            {error}
          </div>
        )}

        {/* ── STEP 1: Email ──────────────────────────────────────────────── */}
        {step === 'email' && (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-gray-600 text-center">
              Nhập email đăng ký tài khoản. Chúng tôi sẽ gửi mã OTP xác nhận.
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-800">Email</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 size-4 text-red-500 pointer-events-none" />
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm
                    focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button onClick={handleSendOtp} disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white font-semibold
                rounded-lg flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              {loading
                ? <Loader2 className="size-4 animate-spin" />
                : <Mail className="size-4" />}
              {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>
          </div>
        )}

        {/* ── STEP 2: OTP ────────────────────────────────────────────────── */}
        {step === 'otp' && (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-gray-600 text-center">
              Mã OTP đã được gửi đến <span className="font-semibold text-red-600">{email}</span>.
              <br />Nhập mã 6 chữ số bên dưới.
            </p>

            <OtpInput value={otp} onChange={setOtp} />

            <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold
                rounded-lg flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              {loading
                ? <Loader2 className="size-4 animate-spin" />
                : <KeyRound className="size-4" />}
              {loading ? 'Đang xác nhận...' : 'Xác nhận OTP'}
            </button>

            {/* Resend */}
            <div className="text-center text-sm">
              {countdown > 0 ? (
                <span className="text-gray-400">
                  Gửi lại sau <span className="font-semibold text-red-600">{countdown}s</span>
                </span>
              ) : (
                <button onClick={handleResend} disabled={loading}
                  className="text-red-600 font-semibold hover:underline flex items-center gap-1 mx-auto">
                  <RefreshCw className="size-3.5" />
                  Gửi lại mã OTP
                </button>
              )}
            </div>

            <button onClick={() => { setStep('email'); setOtp(''); setError(''); }}
              className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="size-4" /> Thay đổi email
            </button>
          </div>
        )}

        {/* ── STEP 3: New Password ────────────────────────────────────────── */}
        {step === 'password' && (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-gray-600 text-center">
              OTP xác nhận thành công! Nhập mật khẩu mới cho tài khoản.
            </p>

            {/* New password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-800">Mật khẩu mới</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 size-4 text-red-500 pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Ít nhất 8 ký tự"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm
                    focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 text-gray-400 hover:text-red-500 transition-colors">
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {/* Strength indicator */}
              {newPassword && (
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      newPassword.length >= i * 4
                        ? i === 1 ? 'bg-red-400' : i === 2 ? 'bg-yellow-400' : 'bg-green-400'
                        : 'bg-gray-200'
                    }`} />
                  ))}
                  <span className="text-xs text-gray-400 ml-1">
                    {newPassword.length < 8 ? 'Yếu' : newPassword.length < 12 ? 'Trung bình' : 'Mạnh'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-800">Xác nhận mật khẩu</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 size-4 text-red-500 pointer-events-none" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                  className={`w-full pl-10 pr-10 py-2.5 border-2 rounded-lg bg-gray-50 text-sm
                    focus:outline-none focus:bg-white transition-all
                    ${confirmPw && confirmPw !== newPassword ? 'border-red-400' : 'border-gray-200 focus:border-red-500'}`}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 text-gray-400 hover:text-red-500 transition-colors">
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {confirmPw && confirmPw !== newPassword && (
                <span className="text-xs text-red-500">Mật khẩu chưa khớp</span>
              )}
            </div>

            <button onClick={handleResetPassword} disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white font-semibold
                rounded-lg flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              {loading
                ? <Loader2 className="size-4 animate-spin" />
                : <Lock className="size-4" />}
              {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
            </button>
          </div>
        )}

        {/* ── DONE ───────────────────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="size-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="size-12 text-green-500" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Đặt lại thành công!</h2>
              <p className="text-sm text-gray-600">
                Mật khẩu đã được cập nhật. Bạn có thể đăng nhập với mật khẩu mới.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg
                flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              Đăng nhập ngay
            </button>
          </div>
        )}

        {/* Back to login */}
        {step !== 'done' && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Nhớ mật khẩu rồi?{' '}
            <Link to="/login" className="text-red-600 font-semibold hover:underline">Đăng nhập</Link>
          </p>
        )}
      </div>
    </div>
  );
}