import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { showToast } = useToast();

  // Form State: Profile Info
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Form State: Security / Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Quản Trị Viên', color: '#7c3aed', bg: '#f5f3ff' };
      case 'FARM_MANAGER':
        return { label: 'Quản Lý Trang Trại', color: '#0284c7', bg: '#f0f9ff' };
      case 'AGRONOMIST':
        return { label: 'Kỹ Sư Nông Học', color: '#059669', bg: '#ecfdf5' };
      case 'OPERATOR':
        return { label: 'Kỹ Thuật Viên Vận Hành', color: '#d97706', bg: '#fffbeb' };
      default:
        return { label: 'Kỹ Sư Trang Trại', color: '#00a651', bg: '#e8f8f0' };
    }
  };

  const roleMeta = getRoleBadge(user?.role);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Lỗi thông tin', 'Họ và tên không được để trống', 'danger');
      return;
    }

    setIsSavingInfo(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined
      });
      showToast('Cập nhật thành công', 'Thông tin cá nhân đã được lưu lại', 'success');
    } catch (err: any) {
      showToast('Cập nhật thất bại', err.message || 'Không thể lưu thay đổi', 'danger');
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Lỗi nhập liệu', 'Vui lòng điền mật khẩu hiện tại và mật khẩu mới', 'danger');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Mật khẩu quá ngắn', 'Mật khẩu mới phải có tối thiểu 6 ký tự', 'danger');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast('Không trùng khớp', 'Xác nhận mật khẩu mới không khớp', 'danger');
      return;
    }

    setIsChangingPass(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast('Đổi mật khẩu thành công', 'Mật khẩu đã được thay đổi an toàn', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      showToast('Đổi mật khẩu thất bại', err.message || 'Mật khẩu hiện tại không chính xác', 'danger');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Toolbar */}
      <div className="page-toolbar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '4px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-subtle)', marginBottom: '4px' }}>
            <span>Hệ thống</span>
            <span>/</span>
            <span style={{ color: 'var(--farmvista-green)', fontWeight: 600 }}>Hồ sơ cá nhân</span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.005em', margin: 0 }}>
            Hồ Sơ Cá Nhân
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-subtle)', margin: '4px 0 0 0' }}>
            Xem và cập nhật thông tin tài khoản, mật khẩu đăng nhập hệ thống
          </p>
        </div>

        {/* Online Status Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: '#e8f8f0',
          border: '1px solid rgba(0, 166, 81, 0.25)',
          color: '#00a651',
          fontSize: '0.78rem',
          fontWeight: 700
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#00a651'
          }} />
          Đang hoạt động
        </div>
      </div>

      {/* Top Hero Info Summary Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg, 16px)',
        border: '1px solid var(--border-medium, #e2e8f0)',
        boxShadow: 'var(--shadow-sm)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Avatar Initials */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: roleMeta.bg,
            color: roleMeta.color,
            border: `2px solid ${roleMeta.color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            flexShrink: 0
          }}>
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {user?.fullName || 'Người Dùng'}
              </h2>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: roleMeta.bg,
                color: roleMeta.color,
                border: `1px solid ${roleMeta.color}30`
              }}>
                <Shield size={11} />
                {roleMeta.label}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', fontSize: '0.8125rem', color: 'var(--text-subtle)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={14} color="var(--text-disabled)" />
                {user?.email}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Phone size={14} color="var(--text-disabled)" />
                {user?.phoneNumber || 'Chưa có SĐT'}
              </span>
            </div>
          </div>
        </div>

        <div style={{
          padding: '8px 16px',
          borderRadius: 'var(--radius-md, 8px)',
          backgroundColor: '#f8fafc',
          border: '1px solid var(--border-subtle)',
          textAlign: 'right'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>Vai trò hệ thống</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: roleMeta.color, marginTop: '2px' }}>
            {roleMeta.label}
          </div>
        </div>
      </div>

      {/* 2 Clean Side-by-Side Cards: Profile Info & Change Password */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1: Thông tin cá nhân */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--border-medium, #e2e8f0)',
          boxShadow: 'var(--shadow-sm)',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <User size={18} color="#00a651" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Thông tin cá nhân
            </h3>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>
                Họ và Tên
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '40px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                backgroundColor: '#ffffff'
              }}>
                <User size={15} color="var(--text-disabled)" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên"
                  required
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem', color: 'var(--text-main)', backgroundColor: 'transparent' }}
                />
              </div>
            </div>

            {/* Email (Readonly) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>
                Địa chỉ Email
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '40px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-subtle, #f1f5f9)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={15} color="var(--text-disabled)" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</span>
                </div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#00a651'
                }}>
                  <CheckCircle2 size={12} />
                  Đã xác minh
                </span>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>
                Số điện thoại liên hệ
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '40px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                backgroundColor: '#ffffff'
              }}>
                <Phone size={15} color="var(--text-disabled)" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Ví dụ: 0901234567"
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem', color: 'var(--text-main)', backgroundColor: 'transparent' }}
                />
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="submit"
                disabled={isSavingInfo}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: isSavingInfo ? '#008f45' : '#00a651',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: isSavingInfo ? 'not-allowed' : 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <Save size={15} />
                <span>{isSavingInfo ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Đổi mật khẩu */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--border-medium, #e2e8f0)',
          boxShadow: 'var(--shadow-sm)',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Key size={18} color="#00a651" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Đổi mật khẩu
            </h3>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Current Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>
                Mật khẩu hiện tại
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '40px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                backgroundColor: '#ffffff'
              }}>
                <Lock size={15} color="var(--text-disabled)" />
                <input
                  type={showOldPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem', backgroundColor: 'transparent' }}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', padding: 0 }}
                >
                  {showOldPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>
                Mật khẩu mới (≥ 6 ký tự)
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '40px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                backgroundColor: '#ffffff'
              }}>
                <Lock size={15} color="var(--text-disabled)" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  required
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem', backgroundColor: 'transparent' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', padding: 0 }}
                >
                  {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>
                Xác nhận lại mật khẩu mới
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '40px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                backgroundColor: '#ffffff'
              }}>
                <Lock size={15} color="var(--text-disabled)" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem', backgroundColor: 'transparent' }}
                />
              </div>
            </div>

            {/* Change Password Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="submit"
                disabled={isChangingPass}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: isChangingPass ? '#008f45' : '#00a651',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: isChangingPass ? 'not-allowed' : 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <Key size={15} />
                <span>{isChangingPass ? 'Đang đổi...' : 'Đổi Mật Khẩu'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
