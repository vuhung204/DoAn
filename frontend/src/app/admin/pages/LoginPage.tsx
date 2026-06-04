import { useState } from 'react';
import { Laptop, User, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:9765/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername]           = useState('');
  const [password, setPassword]           = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError]       = useState('');
  const [isLoading, setIsLoading]         = useState(false);

  const validateUsername = (value: string): boolean => {
    setUsernameError('');
    if (!value.trim()) {
      setUsernameError('Vui lòng nhập tên đăng nhập hoặc email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value.includes('@') && !emailRegex.test(value.trim())) {
      setUsernameError('Email không hợp lệ');
      return false;
    }
    return true;
  };

  const validatePassword = (value: string): boolean => {
    setPasswordError('');
    if (!value) {
      setPasswordError('Vui lòng nhập mật khẩu');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setPasswordError('');
    setLoginError('');

    if (!validateUsername(username) || !validatePassword(password)) return;

    setIsLoading(true);
    try {
      const { data } = await api.post('/admin/auth/login', {
        email:    username.trim(),
        password,
      });

      // Lưu token + thông tin staff vào localStorage
      localStorage.setItem('access_token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken);
      }
      if (data.staff) {
        localStorage.setItem('admin_user', JSON.stringify(data.staff));
      }

      navigate('/admin');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 400) {
        setLoginError('Tên đăng nhập hoặc mật khẩu không đúng');
      } else if (status === 403) {
        setLoginError('Tài khoản không có quyền truy cập hệ thống admin');
      } else if (status === 423) {
        setLoginError('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên');
      } else {
        setLoginError('Không thể kết nối đến máy chủ. Vui lòng thử lại');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center p-5 relative overflow-hidden"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[300px] h-[300px] -top-[100px] -right-[50px] bg-white/5 rounded-full animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute w-[200px] h-[200px] bottom-[50px] -left-[80px] bg-white/5 rounded-full animate-[float_8s_ease-in-out_infinite_reverse]" />
        <div className="absolute w-[150px] h-[150px] top-1/2 right-[10%] bg-white/5 rounded-full animate-[float_10s_ease-in-out_infinite]" />
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-2xl shadow-[0_8px_24px_rgba(37,99,235,0.15)] w-full max-w-[420px] p-12 px-10 relative z-10 animate-[slideUp_0.6s_ease]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-15 h-15 bg-gradient-to-br from-[#2563eb] to-[#667eea] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Laptop className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Laptop Store Admin</h1>
          <p className="text-sm text-gray-500">Hệ thống quản trị cửa hàng</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full">
          {/* Username / Email */}
          <div className="mb-5">
            <label htmlFor="username" className="block text-sm font-semibold text-gray-900 mb-2">
              Tên đăng nhập hoặc Email
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => validateUsername(username)}
                placeholder="Nhập tên đăng nhập hoặc email"
                className="w-full px-4 pr-10 py-3 border-2 border-gray-300 rounded-lg text-sm text-gray-900 transition-all outline-none focus:border-[#2563eb] focus:bg-[#eff6ff] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] placeholder:text-gray-300"
              />
              <User className="absolute right-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
            {usernameError && (
              <span className="block text-xs text-red-500 mt-1.5">{usernameError}</span>
            )}
          </div>

          {/* Password */}
          <div className="mb-5">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
              Mật khẩu
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => validatePassword(password)}
                placeholder="Nhập mật khẩu"
                className="w-full px-4 pr-10 py-3 border-2 border-gray-300 rounded-lg text-sm text-gray-900 transition-all outline-none focus:border-[#2563eb] focus:bg-[#eff6ff] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] placeholder:text-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-2 text-gray-500 hover:text-[#2563eb] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <span className="block text-xs text-red-500 mt-1.5">{passwordError}</span>
            )}
          </div>

          {/* Error Alert */}
          {loginError && (
            <div className="p-3 px-4 rounded-lg text-[13px] mb-4 flex items-center gap-2.5 bg-red-50 text-red-500 border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {loginError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-gradient-to-br from-[#2563eb] to-[#667eea] text-white rounded-lg text-[15px] font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 mb-5 shadow-[0_2px_8px_rgba(37,99,235,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(37,99,235,0.15)] active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Đăng Nhập
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 border-t border-gray-300 pt-5 mt-1">
          <p>
            Phiên bản <span className="text-[#2563eb] font-semibold">1.0</span> | Laptop Store © 2026
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(30px); }
        }
      `}</style>
    </div>
  );
}
