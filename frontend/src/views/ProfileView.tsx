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
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award
} from 'lucide-react';
import './ProfileView.css';

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
        return { label: 'Quản Trị Viên', color: '#7c3aed', bg: '#f5f3ff', badgeClass: 'purple' };
      case 'FARM_MANAGER':
        return { label: 'Quản Lý Trang Trại', color: '#0284c7', bg: '#f0f9ff', badgeClass: 'blue' };
      case 'AGRONOMIST':
        return { label: 'Kỹ Sư Nông Học', color: '#059669', bg: '#ecfdf5', badgeClass: 'green' };
      case 'OPERATOR':
        return { label: 'Kỹ Thuật Viên Vận Hành', color: '#d97706', bg: '#fffbeb', badgeClass: 'amber' };
      default:
        return { label: 'Kỹ Sư Trang Trại', color: '#00a651', bg: '#e8f8f0', badgeClass: 'green' };
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
    <div className="profile-container">
      {/* ========================================================
          1. HEADER: Synchronized Top Bar
          ======================================================== */}
      <div className="profile-header">
        <div className="profile-header-left">
          <div>
            <h1 className="profile-title">
              <User size={22} color="#00a651" />
              Hồ Sơ Cá Nhân & Phân Quyền
            </h1>
            <div className="profile-subtitle">
              Quản lý thông tin định danh kỹ sư, vai trò quản trị hệ thống và thiết lập mật khẩu bảo mật
            </div>
          </div>
        </div>

        <div className="profile-header-actions">
          <span className="profile-status-pill">
            <span className="dot" />
            Tài khoản đang hoạt động
          </span>
        </div>
      </div>

      {/* ========================================================
          2. KPI CARDS: 4 Account & Security Metrics
          ======================================================== */}
      <div className="profile-kpis">
        {/* Metric 1: Vai trò */}
        <div className="profile-kpi-card">
          <div className="profile-kpi-top">
            <span className="profile-kpi-label">Vai Trò Hệ Thống</span>
            <div className="profile-kpi-icon" style={{ backgroundColor: roleMeta.bg, color: roleMeta.color }}>
              <Shield size={17} />
            </div>
          </div>
          <div className="profile-kpi-val" style={{ color: roleMeta.color }}>
            {roleMeta.label}
          </div>
          <div className="profile-kpi-meta">
            <span>Đặc quyền truy cập</span>
            <span className={`profile-kpi-badge ${roleMeta.badgeClass}`}>
              Đầy đủ quyền
            </span>
          </div>
        </div>

        {/* Metric 2: Xác thực email */}
        <div className="profile-kpi-card">
          <div className="profile-kpi-top">
            <span className="profile-kpi-label">Định Danh Email</span>
            <div className="profile-kpi-icon" style={{ backgroundColor: '#ecfdf5', color: '#16a34a' }}>
              <Mail size={17} />
            </div>
          </div>
          <div className="profile-kpi-val" style={{ color: '#0f172a' }}>
            Đã Xác Minh
          </div>
          <div className="profile-kpi-meta">
            <span>Địa chỉ email</span>
            <span className="profile-kpi-badge green">
              Chính chủ
            </span>
          </div>
        </div>

        {/* Metric 3: Phiên làm việc */}
        <div className="profile-kpi-card">
          <div className="profile-kpi-top">
            <span className="profile-kpi-label">Phiên Đăng Nhập</span>
            <div className="profile-kpi-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <Clock size={17} />
            </div>
          </div>
          <div className="profile-kpi-val" style={{ color: '#0284c7' }}>
            Trực Tuyến
          </div>
          <div className="profile-kpi-meta">
            <span>Thời hạn phiên</span>
            <span className="profile-kpi-badge blue">
              Tự động gia hạn
            </span>
          </div>
        </div>

        {/* Metric 4: Tiêu chuẩn bảo mật */}
        <div className="profile-kpi-card">
          <div className="profile-kpi-top">
            <span className="profile-kpi-label">Mức Độ An Toàn</span>
            <div className="profile-kpi-icon" style={{ backgroundColor: '#ecfdf5', color: '#16a34a' }}>
              <ShieldCheck size={17} />
            </div>
          </div>
          <div className="profile-kpi-val" style={{ color: '#16a34a' }}>
            Mức Cao (A+)
          </div>
          <div className="profile-kpi-meta">
            <span>Mã hóa dữ liệu</span>
            <span className="profile-kpi-badge green">
              SHA-256 / SSL
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. USER SUMMARY HERO CARD
          ======================================================== */}
      <div className="profile-user-hero">
        <div className="profile-user-info-left">
          <div 
            className="profile-avatar-circle"
            style={{ 
              backgroundColor: roleMeta.bg, 
              color: roleMeta.color,
              border: `2px solid ${roleMeta.color}35`
            }}
          >
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 className="profile-user-name">{user?.fullName || 'Kỹ Sư Nông Nghiệp'}</h2>
              <span 
                className="profile-badge-pill"
                style={{ backgroundColor: roleMeta.bg, color: roleMeta.color, border: `1px solid ${roleMeta.color}30` }}
              >
                <Award size={12} />
                {roleMeta.label}
              </span>
            </div>

            <div className="profile-user-meta-row">
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={14} color="#94a3b8" />
                {user?.email}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Phone size={14} color="#94a3b8" />
                {user?.phoneNumber || 'Chưa cập nhật SĐT'}
              </span>
            </div>
          </div>
        </div>

        <div style={{
          padding: '8px 16px',
          borderRadius: '8px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          textAlign: 'right'
        }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
            Phân khu phụ trách
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
            Nhà màng NFT 01 & 02
          </div>
        </div>
      </div>

      {/* ========================================================
          4. FORMS: Personal Info & Password Management
          ======================================================== */}
      <div className="profile-forms-grid">
        {/* Form 1: Cập nhật thông tin */}
        <div className="profile-form-card">
          <div>
            <div className="profile-card-header">
              <User size={18} color="#00a651" />
              <h3 className="profile-card-title">Thông Tin Cá Nhân</h3>
            </div>

            <form onSubmit={handleSaveProfile}>
              {/* Họ tên */}
              <div className="profile-input-group">
                <label className="profile-input-label">Họ và Tên</label>
                <div className="profile-input-wrapper">
                  <User size={15} color="#94a3b8" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên đầy đủ"
                    required
                    className="profile-input-field"
                  />
                </div>
              </div>

              {/* Email (Readonly) */}
              <div className="profile-input-group">
                <label className="profile-input-label">Địa chỉ Email</label>
                <div className="profile-input-wrapper readonly">
                  <Mail size={15} color="#94a3b8" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="profile-input-field"
                    style={{ color: '#64748b', cursor: 'not-allowed' }}
                  />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                    <CheckCircle2 size={12} />
                    Xác minh
                  </span>
                </div>
              </div>

              {/* SĐT */}
              <div className="profile-input-group">
                <label className="profile-input-label">Số Điện Thoại Liên Hệ</label>
                <div className="profile-input-wrapper">
                  <Phone size={15} color="#94a3b8" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Ví dụ: 0912 345 678"
                    className="profile-input-field"
                  />
                </div>
              </div>

              <div className="profile-form-actions">
                <button
                  type="submit"
                  disabled={isSavingInfo}
                  className="farmvista-btn-green"
                  style={{ height: '36px', fontSize: '0.8125rem', padding: '0 18px' }}
                >
                  <Save size={15} />
                  <span>{isSavingInfo ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Form 2: Đổi mật khẩu */}
        <div className="profile-form-card">
          <div>
            <div className="profile-card-header">
              <Key size={18} color="#00a651" />
              <h3 className="profile-card-title">Đổi Mật Khẩu Đăng Nhập</h3>
            </div>

            <form onSubmit={handleChangePassword}>
              {/* Mật khẩu cũ */}
              <div className="profile-input-group">
                <label className="profile-input-label">Mật khẩu hiện tại</label>
                <div className="profile-input-wrapper">
                  <Lock size={15} color="#94a3b8" />
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang dùng"
                    required
                    className="profile-input-field"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
                  >
                    {showOldPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Mật khẩu mới */}
              <div className="profile-input-group">
                <label className="profile-input-label">Mật khẩu mới (≥ 6 ký tự)</label>
                <div className="profile-input-wrapper">
                  <Lock size={15} color="#94a3b8" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự an toàn"
                    required
                    className="profile-input-field"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
                  >
                    {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div className="profile-input-group">
                <label className="profile-input-label">Xác nhận mật khẩu mới</label>
                <div className="profile-input-wrapper">
                  <Lock size={15} color="#94a3b8" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                    className="profile-input-field"
                  />
                </div>
              </div>

              <div className="profile-form-actions">
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="farmvista-btn-secondary"
                  style={{ height: '36px', fontSize: '0.8125rem', padding: '0 18px', borderColor: '#cbd5e1' }}
                >
                  <Key size={15} color="#00a651" />
                  <span>{isChangingPass ? 'Đang đổi...' : 'Đổi Mật Khẩu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
