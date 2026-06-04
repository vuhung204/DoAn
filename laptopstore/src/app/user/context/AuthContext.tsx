import { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:9765';

interface AuthContextType {
  userEmail: string;
  userFullName: string;
  userLoggedIn: boolean;
  userRole: string;
  cartCount: number;
  setLoggedIn: (email: string, fullName: string, role: string, rememberMe: boolean) => void;
  logout: () => void;
  refreshCart: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userEmail, setUserEmail] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [cartCount, setCartCount] = useState(0);

  // ── Fetch cart count từ API ──────────────────────────────────────────────
  const refreshCart = useCallback(async () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      setCartCount(0);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setCartCount(0); return; }
      const data = await res.json();
      setCartCount(typeof data.totalItems === 'number' ? data.totalItems : 0);
    } catch {
      setCartCount(0);
    }
  }, []);

  // ── Khởi tạo auth state từ storage ──────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const isLoggedIn = sessionStorage.getItem('userLoggedIn') === 'true';
    if (token && isLoggedIn) {
      setUserLoggedIn(true);
      setUserEmail(sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail') || '');
      setUserFullName(sessionStorage.getItem('userFullName') || localStorage.getItem('userFullName') || '');
      setUserRole(sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || '');
    }
  }, []);

  // ── Fetch cart mỗi khi trạng thái đăng nhập thay đổi ────────────────────
  useEffect(() => {
    if (userLoggedIn) {
      refreshCart();
    } else {
      setCartCount(0);
    }
  }, [userLoggedIn, refreshCart]);

  // ── Lắng nghe custom event "cart-updated" từ bất kỳ component nào ───────
  useEffect(() => {
    const handler = () => refreshCart();
    window.addEventListener('cart-updated', handler);
    return () => window.removeEventListener('cart-updated', handler);
  }, [refreshCart]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const logout = () => {
    setUserEmail('');
    setUserFullName('');
    setUserLoggedIn(false);
    setUserRole('');
    setCartCount(0);
    sessionStorage.clear();
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userRole');
  };

  const setLoggedIn = (email: string, fullName: string, role: string, rememberMe: boolean) => {
    setUserEmail(email);
    setUserFullName(fullName);
    setUserLoggedIn(true);
    setUserRole(role);
    sessionStorage.setItem('userLoggedIn', 'true');
    sessionStorage.setItem('userEmail', email);
    sessionStorage.setItem('userFullName', fullName);
    sessionStorage.setItem('userRole', role);
    if (rememberMe) {
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userFullName', fullName);
      localStorage.setItem('userRole', role);
    }
  };

  return (
    <AuthContext.Provider value={{
      userEmail, userFullName, userLoggedIn, userRole,
      cartCount, setLoggedIn, logout, refreshCart,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Gọi hàm này sau khi thêm / xóa / cập nhật giỏ hàng ở bất kỳ component nào.
 * Header badge sẽ cập nhật ngay lập tức mà không cần reload trang.
 *
 * Ví dụ trong ProductDetailPage:
 *   import { notifyCartUpdated } from '../context/AuthContext';
 *   if (res.ok) { notifyCartUpdated(); }
 *
 * Ví dụ trong CartPage (sau update/delete):
 *   if (res.ok) { notifyCartUpdated(); await fetchCart(); }
 */
export function notifyCartUpdated() {
  window.dispatchEvent(new Event('cart-updated'));
}