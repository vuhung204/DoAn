import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, Mail, Lock, Phone, User, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordStrength = () => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };
  const strengthLabels = ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];
  const strengthColors = ['', 'bg-red-500', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];
  const strength = getPasswordStrength();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 3) e.fullName = 'Họ tên ít nhất 3 ký tự';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email không hợp lệ';
    if (!phone || !/^(\+84|0)\d{9,10}$/.test(phone.replace(/\s/g, ''))) e.phone = 'SĐT không hợp lệ (VD: 0912345678)';
    if (!password || password.length < 8) e.password = 'Mật khẩu ít nhất 8 ký tự';
    if (password !== confirmPassword) e.confirmPassword = 'Mật khẩu không trùng khớp';
    if (!agreeTerms) e.terms = 'Bạn phải đồng ý với điều khoản';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage('');
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:9765/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Đăng ký thất bại');
      }
      setAlertType('success');
      setAlertMessage('Đăng ký thành công! Đang chuyển sang trang đăng nhập...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setAlertType('danger');
      setAlertMessage(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4 py-8">
      <div className="fixed top-[-100px] right-[-100px] w-96 h-96 bg-red-400 rounded-full opacity-10 pointer-events-none" />
      <div className="fixed bottom-[50px] left-[-50px] w-72 h-72 border-4 border-red-400 rounded-3xl opacity-10 pointer-events-none" />

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-full mb-4 shadow-lg">
            <UserPlus className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo Tài Khoản</h1>
          <p className="text-sm text-gray-500 mt-1">Tham gia cộng đồng ShopLaptop ngay</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-800">Họ và Tên</label>
            <div className="relative flex items-center">
              <User className="absolute left-3 size-4 text-red-500 pointer-events-none" />
              <input type="text" placeholder="Nguyễn Văn A" value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all" />
            </div>
            {errors.fullName && <span className="text-xs text-red-600">{errors.fullName}</span>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-800">Email</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 size-4 text-red-500 pointer-events-none" />
              <input type="email" placeholder="example@email.com" value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all" />
            </div>
            {errors.email && <span className="text-xs text-red-600">{errors.email}</span>}
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-800">Số điện thoại</label>
            <div className="relative flex items-center">
              <Phone className="absolute left-3 size-4 text-red-500 pointer-events-none" />
              <input type="tel" placeholder="0912345678" value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all" />
            </div>
            {errors.phone && <span className="text-xs text-red-600">{errors.phone}</span>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-800">Mật khẩu</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 size-4 text-red-500 pointer-events-none" />
              <input type={showPassword ? 'text' : 'password'} placeholder="Tối thiểu 8 ký tự" value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-red-500">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {password && (
              <>
                <div className="flex gap-1 mt-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : 'bg-gray-200'}`} />
                  ))}
                </div>
                <span className="text-xs text-gray-500">{strengthLabels[strength]}</span>
              </>
            )}
            {errors.password && <span className="text-xs text-red-600">{errors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-800">Xác nhận mật khẩu</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 size-4 text-red-500 pointer-events-none" />
              <input type={showConfirm ? 'text' : 'password'} placeholder="Nhập lại mật khẩu" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 text-gray-400 hover:text-red-500">
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && <span className="text-xs text-red-600">{errors.confirmPassword}</span>}
          </div>

          {/* Terms */}
          <div className="flex flex-col gap-1">
            <label className="flex items-start gap-2 cursor-pointer text-sm text-gray-600">
              <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)}
                className="accent-red-600 w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Tôi đồng ý với <a href="#" className="text-red-600 font-semibold hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="text-red-600 font-semibold hover:underline">Chính sách bảo mật</a></span>
            </label>
            {errors.terms && <span className="text-xs text-red-600">{errors.terms}</span>}
          </div>

          {/* Submit */}
          <button type="submit" disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-70 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg mt-1">
            {isLoading ? (
              <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
            ) : (
              <UserPlus className="size-4" />
            )}
            {isLoading ? 'Đang xử lý...' : 'Đăng Ký Ngay'}
          </button>

          {alertMessage && (
            <div className={`px-4 py-3 rounded-lg text-sm border-l-4 ${alertType === 'success' ? 'bg-green-50 text-green-700 border-green-500' : 'bg-red-50 text-red-700 border-red-500'}`}>
              {alertMessage}
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-2">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-red-600 font-semibold hover:underline">Đăng nhập tại đây</Link>
          </p>
        </form>
      </div>
    </div>
  );
}