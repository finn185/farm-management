import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';
import {
  Sprout,
  Mail,
  Lock,
  User,
  Phone,
  Briefcase,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

export const RegisterView: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>('AGRONOMIST');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu bảo mật phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        role,
        password
      });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng ký tài khoản không thành công. Vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-page, #f8fafc)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Ambient background glow and dots */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '400px',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(0, 166, 81, 0.08) 0%, rgba(0, 166, 81, 0.02) 50%, transparent 75%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        opacity: 0.6,
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        width: '100%',
        maxWidth: '500px',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Brand Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2.5px solid #00a651',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00a651',
              boxShadow: '0 2px 8px rgba(0, 166, 81, 0.15)'
            }}>
              <Sprout size={22} strokeWidth={2.5} />
            </div>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#111827',
              letterSpacing: '0.005em'
            }}>
              Hydro<span style={{ color: '#00a651' }}>Smart</span>
            </span>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#e8f8f0',
            color: '#00a651',
            borderRadius: '9999px',
            padding: '4px 12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            border: '1px solid rgba(0, 166, 81, 0.2)'
          }}>
            Tạo tài khoản thành viên mới
          </div>
        </div>

        {/* Form Card */}
        <div style={{
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--border-medium, #e2e8f0)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.02), 0 20px 25px -5px rgba(0, 0, 0, 0.03)',
          padding: '28px 30px',
          boxSizing: 'border-box'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-main, #111827)',
              letterSpacing: '0.005em',
              margin: '0 0 4px 0'
            }}>
              Đăng ký tài khoản
            </h2>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--text-subtle, #6b7280)',
              margin: 0
            }}>
              Nhập thông tin cá nhân và vai trò để thiết lập quyền truy cập
            </p>
          </div>

          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main, #111827)', marginBottom: '5px' }}>
                Họ và Tên <span style={{ color: '#ef4444' }}>*</span>
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
                <User size={16} color="var(--text-disabled, #9ca3af)" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Kỹ Sư"
                  required
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem', backgroundColor: 'transparent' }}
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main, #111827)', marginBottom: '5px' }}>
                  Địa chỉ Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #e2e8f0)',
                  backgroundColor: '#ffffff'
                }}>
                  <Mail size={15} color="var(--text-disabled, #9ca3af)" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@hydrosmart.farm"
                    required
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', backgroundColor: 'transparent' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main, #111827)', marginBottom: '5px' }}>
                  Số điện thoại
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #e2e8f0)',
                  backgroundColor: '#ffffff'
                }}>
                  <Phone size={15} color="var(--text-disabled, #9ca3af)" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0901234567"
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', backgroundColor: 'transparent' }}
                  />
                </div>
              </div>
            </div>

            {/* Role Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main, #111827)', marginBottom: '5px' }}>
                Vai trò chuyên môn <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                height: '40px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                backgroundColor: '#ffffff'
              }}>
                <Briefcase size={15} color="var(--text-disabled, #9ca3af)" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.85rem',
                    backgroundColor: 'transparent',
                    color: 'var(--text-main, #111827)',
                    cursor: 'pointer'
                  }}
                >
                  <option value="AGRONOMIST">Kỹ sư Nông Học & Dinh dưỡng (AGRONOMIST)</option>
                  <option value="FARM_MANAGER">Quản lý Trang trại (FARM_MANAGER)</option>
                  <option value="OPERATOR">Kỹ thuật viên Vận hành giàn (OPERATOR)</option>
                  <option value="SUPER_ADMIN">Quản trị viên Hệ thống (SUPER_ADMIN)</option>
                </select>
              </div>
            </div>

            {/* Password & Confirm */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main, #111827)', marginBottom: '5px' }}>
                  Mật khẩu <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #e2e8f0)',
                  backgroundColor: '#ffffff'
                }}>
                  <Lock size={15} color="var(--text-disabled, #9ca3af)" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="≥ 6 ký tự"
                    required
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', backgroundColor: 'transparent' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-disabled, #9ca3af)' }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main, #111827)', marginBottom: '5px' }}>
                  Xác nhận lại <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #e2e8f0)',
                  backgroundColor: '#ffffff'
                }}>
                  <Lock size={15} color="var(--text-disabled, #9ca3af)" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại"
                    required
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', backgroundColor: 'transparent' }}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '4px',
                height: '42px',
                borderRadius: '8px',
                backgroundColor: isSubmitting ? '#008f45' : '#00a651',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-sm, 0 1px 3px 0 rgba(0, 0, 0, 0.04))',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.currentTarget.style.backgroundColor = '#008f45';
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) e.currentTarget.style.backgroundColor = '#00a651';
              }}
            >
              <span>{isSubmitting ? 'Đang tạo tài khoản...' : 'Hoàn tất Đăng ký'}</span>
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Footer Back to Login */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle, #edf0f3)',
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--text-subtle, #6b7280)'
          }}>
            Đã có tài khoản kỹ sư?{' '}
            <Link
              to="/login"
              style={{
                color: '#00a651',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>

        <div style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.72rem',
          color: 'var(--text-subtle, #6b7280)'
        }}>
          <ShieldCheck size={13} color="#00a651" />
          <span>Tài khoản được mã hóa và phân quyền theo chuẩn ISO/IEC Nông nghiệp số</span>
        </div>
      </div>
    </div>
  );
};
