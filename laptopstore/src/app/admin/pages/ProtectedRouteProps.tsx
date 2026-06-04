import { Navigate } from 'react-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Bọc các route admin — nếu chưa có access_token thì redirect về /admin/login.
 * Dùng trong router config thay vì check thủ công trong từng page.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}