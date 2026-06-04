import { useState } from 'react';
import { Outlet, Navigate } from 'react-router';
import Sidebar from '../components/Sidebar';
import { ProfileModal, PasswordModal, SettingsModal, LogoutModal } from '../components/ProfileModals';
import { useNavigate } from 'react-router';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isLoggedIn = !!localStorage.getItem('access_token');

  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('admin_user');
  setShowLogoutModal(false);
  navigate('/admin/login');
};

  return (
    <div className="grid h-screen overflow-hidden" style={{ gridTemplateColumns: '240px 1fr', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <Sidebar
        onProfileClick={() => setShowProfileModal(true)}
        onPasswordClick={() => setShowPasswordModal(true)}
        onSettingsClick={() => setShowSettingsModal(true)}
        onLogoutClick={() => setShowLogoutModal(true)}
      />

      <main className="h-screen overflow-y-auto bg-gray-50 px-7 py-7 pb-10">
        <Outlet />
      </main>

      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <PasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
