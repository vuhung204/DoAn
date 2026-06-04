import { useState } from 'react';
import { X, Camera, Save, Eye, EyeOff, InfoIcon, LogOut } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [name, setName] = useState('Admin User');
  const [email, setEmail] = useState('admin@laptopstore.com');
  const [phone, setPhone] = useState('0961560888');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) {
      alert('Vui lòng nhập tên');
      return;
    }
    alert('Cập nhật thông tin thành công!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-[600px] w-[90%] max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">Thông Tin Cá Nhân</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <div className="px-6 py-6">
          <div className="text-center mb-5">
            <div className="relative w-25 h-25 mx-auto mb-4">
              <div className="w-full h-full rounded-full bg-[#2563eb] text-white text-[40px] font-extrabold flex items-center justify-center">
                AD
              </div>
              <button className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#2563eb] text-white border-3 border-white flex items-center justify-center hover:bg-[#eff6ff] hover:text-[#2563eb] hover:border-gray-200 transition-all">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-gray-900">Họ và Tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-2.5 border-1.5 border-gray-200 rounded-md text-sm text-gray-900 outline-none focus:border-[#2563eb] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-gray-900">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-3 py-2.5 border-1.5 border-gray-200 rounded-md text-sm text-gray-900 outline-none focus:border-[#2563eb] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-gray-900">Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="px-3 py-2.5 border-1.5 border-gray-200 rounded-md text-sm text-gray-900 outline-none focus:border-[#2563eb] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-gray-900">Vị trí</label>
              <select className="px-3 py-2.5 border-1.5 border-gray-200 rounded-md text-sm text-gray-900 outline-none focus:border-[#2563eb] transition-colors">
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Staff">Nhân viên</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-gray-900">Ngày tham gia</label>
              <input
                type="text"
                value="01/01/2024"
                disabled
                className="px-3 py-2.5 border-1.5 border-gray-200 rounded-md text-sm text-gray-900 bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-gray-900">Chi nhánh</label>
              <select className="px-3 py-2.5 border-1.5 border-gray-200 rounded-md text-sm text-gray-900 outline-none focus:border-[#2563eb] transition-colors">
                <option value="Hà Nội">Hà Nội</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                <option value="Cần Thơ">Cần Thơ</option>
                <option value="Hải Phòng">Hải Phòng</option>
              </select>
            </div>
          </form>
        </div>
        <div className="flex items-center justify-end gap-2.5 px-6 py-5 border-t border-gray-200 bg-white sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2.25 rounded-md bg-gray-50 text-gray-600 text-sm font-semibold hover:bg-gray-200 hover:text-gray-900 transition-all">
            Hủy
          </button>
          <button onClick={handleSave} className="px-4 py-2.25 rounded-md bg-[#2563eb] text-white text-sm font-semibold hover:bg-[#1d4ed8] transition-all flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" />
            Lưu Thay Đổi
          </button>
        </div>
      </div>
    </div>
  );
}

export function PasswordModal({ isOpen, onClose }: ProfileModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [strength, setStrength] = useState(0);

  if (!isOpen) return null;

  const handlePasswordChange = (pwd: string) => {
    setNewPassword(pwd);
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[!@#$%^&*]/.test(pwd)) s++;
    setStrength(Math.min(s, 3));
  };

  const handleConfirm = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu không trùng khớp');
      return;
    }
    if (newPassword.length < 8) {
      alert('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    alert('Đổi mật khẩu thành công!');
    onClose();
  };

  const strengthColors = ['#e5e7eb', '#f59e0b', '#2563eb', '#10b981'];
  const strengthTexts = ['Yếu', 'Trung bình', 'Khá', 'Mạnh'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-[480px] w-[90%] max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">Đổi Mật Khẩu</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <div className="px-6 py-6">
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-gray-900">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 border-1.5 border-gray-200 rounded-md text-sm text-gray-900 outline-none focus:border-[#2563eb] transition-colors"
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-900"
                >
                  {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-gray-900">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 border-1.5 border-gray-200 rounded-md text-sm text-gray-900 outline-none focus:border-[#2563eb] transition-colors"
                  placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-900"
                >
                  {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <InfoIcon className="w-3 h-3" />
                Nhập ít nhất 8 ký tự, bao gồm chữ hoa và chứa số
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-gray-900">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 border-1.5 border-gray-200 rounded-md text-sm text-gray-900 outline-none focus:border-[#2563eb] transition-colors"
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-900"
                >
                  {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-3 bg-gray-50 rounded-md mt-2">
              <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">Độ mạnh:</span>
              <div className="flex gap-1 flex-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex-1 h-1 rounded-sm transition-colors"
                    style={{ backgroundColor: i <= strength ? strengthColors[strength] : '#e5e7eb' }}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-600 min-w-[45px] text-right">
                {strengthTexts[strength]}
              </span>
            </div>
          </form>
        </div>
        <div className="flex items-center justify-end gap-2.5 px-6 py-5 border-t border-gray-200 bg-white sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2.25 rounded-md bg-gray-50 text-gray-600 text-sm font-semibold hover:bg-gray-200 hover:text-gray-900 transition-all">
            Hủy
          </button>
          <button onClick={handleConfirm} className="px-4 py-2.25 rounded-md bg-[#2563eb] text-white text-sm font-semibold hover:bg-[#1d4ed8] transition-all flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" />
            Đổi Mật Khẩu
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({ isOpen, onClose }: ProfileModalProps) {
  if (!isOpen) return null;

  const handleSave = () => {
    alert('Lưu cài đặt thành công!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-[500px] w-[90%] max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">Cài Đặt Hệ Thống</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <div className="px-6 py-6">
          <form className="flex flex-col gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-gray-900">
              <input type="checkbox" defaultChecked className="w-4.5 h-4.5 cursor-pointer accent-[#2563eb]" />
              <span>Nhận thông báo qua email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-gray-900">
              <input type="checkbox" defaultChecked className="w-4.5 h-4.5 cursor-pointer accent-[#2563eb]" />
              <span>Nhận thông báo qua SMS</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-gray-900">
              <input type="checkbox" defaultChecked className="w-4.5 h-4.5 cursor-pointer accent-[#2563eb]" />
              <span>Bật thông báo push</span>
            </label>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-gray-900">Ngôn ngữ giao diện</label>
              <select className="px-3 py-2.5 border-1.5 border-gray-200 rounded-md text-sm text-gray-900 outline-none focus:border-[#2563eb] transition-colors">
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-gray-900">Múi giờ</label>
              <select className="px-3 py-2.5 border-1.5 border-gray-200 rounded-md text-sm text-gray-900 outline-none focus:border-[#2563eb] transition-colors">
                <option value="ICT">ICT (UTC+7) - Việt Nam</option>
                <option value="UTC">UTC</option>
                <option value="EST">EST (UTC-5)</option>
              </select>
            </div>
          </form>
        </div>
        <div className="flex items-center justify-end gap-2.5 px-6 py-5 border-t border-gray-200 bg-white sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2.25 rounded-md bg-gray-50 text-gray-600 text-sm font-semibold hover:bg-gray-200 hover:text-gray-900 transition-all">
            Hủy
          </button>
          <button onClick={handleSave} className="px-4 py-2.25 rounded-md bg-[#2563eb] text-white text-sm font-semibold hover:bg-[#1d4ed8] transition-all flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" />
            Lưu Cài Đặt
          </button>
        </div>
      </div>
    </div>
  );
}

export function LogoutModal({ isOpen, onClose, onConfirm }: ProfileModalProps & { onConfirm: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-[400px] w-[90%] animate-slideUp p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-15 h-15 mx-auto mb-5 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
          <LogOut className="w-7 h-7" />
        </div>
        <h3 className="text-center text-base font-bold text-gray-900 mb-2">Xác nhận đăng xuất?</h3>
        <p className="text-center text-sm text-gray-600 mb-5">Bạn có chắc chắn muốn đăng xuất không?</p>
        <div className="flex items-center justify-end gap-2.5">
          <button onClick={onClose} className="px-4 py-2.25 rounded-md bg-gray-50 text-gray-600 text-sm font-semibold hover:bg-gray-200 hover:text-gray-900 transition-all">
            Hủy
          </button>
          <button onClick={onConfirm} className="px-4 py-2.25 rounded-md bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" />
            Đăng Xuất
          </button>
        </div>
      </div>
    </div>
  );
}
