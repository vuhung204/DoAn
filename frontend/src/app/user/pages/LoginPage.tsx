import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, Mail, Lock, LogIn, Laptop } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setLoggedIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = () => {
    if (!email) { setEmailError('Vui lòng nhập email'); return false; }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) { setEmailError('Email không hợp lệ'); return false; }
    setEmailError(''); return true;
  };

  const validatePassword = () => {
    if (!password) { setPasswordError('Vui lòng nhập mật khẩu'); return false; }
    if (password.length < 6) { setPasswordError('Mật khẩu ít nhất 6 ký tự'); return false; }
    setPasswordError(''); return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage('');
    if (!validateEmail() || !validatePassword()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:9765/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Email hoặc mật khẩu không đúng');
      }
      const data = await res.json();
      localStorage.setItem('authToken', data.token);
      sessionStorage.setItem('authToken', data.token);
      setLoggedIn(data.email, data.fullName, data.role, rememberMe);
      setAlertType('success');
      setAlertMessage('Đăng nhập thành công! Đang chuyển hướng...');
      setTimeout(() => navigate('/'), 1000);
    } catch (err: any) {
      setAlertType('danger');
      setAlertMessage(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4 py-8">
      {/* Decoration shapes */}
      <div className="fixed top-[-100px] right-[-100px] w-96 h-96 bg-red-400 rounded-full opacity-10 pointer-events-none" />
      <div className="fixed bottom-[50px] left-[-50px] w-72 h-72 border-4 border-red-400 rounded-3xl opacity-10 pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-full mb-4 shadow-lg">
            <Laptop className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Đăng Nhập</h1>
          <p className="text-sm text-gray-500 mt-1">Chào mừng bạn quay lại ShopLaptop</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-800">Email</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 size-4 text-red-500 pointer-events-none" />
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={validateEmail}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all"
              />
            </div>
            {emailError && <span className="text-xs text-red-600">{emailError}</span>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-800">Mật khẩu</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 size-4 text-red-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={validatePassword}
                className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-red-500 transition-colors">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {passwordError && <span className="text-xs text-red-600">{passwordError}</span>}
          </div>

          {/* Options */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                className="accent-red-600 w-4 h-4" />
              <span className="text-gray-600">Ghi nhớ đăng nhập</span>
            </label>
            <a href="/forgot-password" className="text-red-600 font-semibold hover:underline">Quên mật khẩu?</a>
          </div>

          {/* Submit */}
          <button type="submit" disabled={isLoading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg mt-1">
            {isLoading ? (
              <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
            ) : (
              <LogIn className="size-4" />
            )}
            {isLoading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>

          {/* Alert */}
          {alertMessage && (
            <div className={`px-4 py-3 rounded-lg text-sm border-l-4 ${alertType === 'success' ? 'bg-green-50 text-green-700 border-green-500' : 'bg-red-50 text-red-700 border-red-500'}`}>
              {alertMessage}
            </div>
          )}

          {/* Register link */}
          <p className="text-center text-sm text-gray-500 mt-2">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-red-600 font-semibold hover:underline">Đăng ký ngay</Link>
          </p>
        </form>
      </div>
    </div>
  );
}