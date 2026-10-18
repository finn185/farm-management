import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Zap,
  Leaf,
  BarChart3,
  Shield
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('engineer@hydrosmart.farm');
  const [password, setPassword] = useState('HydroSmart123@');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeQuickRole, setActiveQuickRole] = useState<'engineer' | 'manager' | 'admin'>('engineer');

  // Return to previous target route or /dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectQuickRole = (role: 'engineer' | 'manager' | 'admin', roleEmail: string) => {
    setActiveQuickRole(role);
    setEmail(roleEmail);
    setPassword('HydroSmart123@');
    setErrorMsg(null);
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
      {/* Subtle Ambient Background Mesh & Dots */}
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

      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Brand Header matching Sidebar & Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '28px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              border: '2.5px solid #00a651',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00a651',
              boxShadow: '0 2px 8px rgba(0, 166, 81, 0.15)'
            }}>
              <Sprout size={24} strokeWidth={2.5} />
            </div>
            <span style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#111827',
              letterSpacing: '0.005em',
              lineHeight: 1.2
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
            padding: '4px 14px',
            fontSize: '0.75rem',
            fontWeight: 600,
            border: '1px solid rgba(0, 166, 81, 0.2)'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#00a651'
            }} />
            Hệ thống Quản lý Thủy canh NFT & AI
          </div>
        </div>

        {/* Elevated Dashboard-Style Card */}
        <div style={{
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--border-medium, #e2e8f0)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.02), 0 20px 25px -5px rgba(0, 0, 0, 0.03)',
          padding: '32px 32px 28px',
          boxSizing: 'border-box'
        }}>
          {/* Card Title */}
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-main, #111827)',
              letterSpacing: '0.005em',
              margin: '0 0 4px 0'
            }}>
              Đăng nhập tài khoản
            </h2>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--text-subtle, #6b7280)',
              margin: 0
            }}>
              Truy cập bảng điều khiển giám sát dinh dưỡng và năng suất
            </p>
          </div>

          {/* Quick Demo Role Selector (Segmented Tabs) */}
          <div style={{
            marginBottom: '20px',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            padding: '10px 12px',
            border: '1px solid #edf0f3'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-muted, #4b5563)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Zap size={13} color="#f59e0b" />
                Đăng nhập mẫu nhanh (1-Click):
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '6px'
            }}>
              {/* Role 1: Agronomist */}
              <button
                type="button"
                onClick={() => handleSelectQuickRole('engineer', 'engineer@hydrosmart.farm')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: activeQuickRole === 'engineer' ? '1.5px solid #00a651' : '1px solid #e2e8f0',
                  backgroundColor: activeQuickRole === 'engineer' ? '#e8f8f0' : '#ffffff',
                  color: activeQuickRole === 'engineer' ? '#00a651' : 'var(--text-muted, #4b5563)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <Leaf size={14} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Kỹ sư</span>
                </div>
                <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>Nông học</span>
              </button>

              {/* Role 2: Farm Manager */}
              <button
                type="button"
                onClick={() => handleSelectQuickRole('manager', 'manager@hydrosmart.farm')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: activeQuickRole === 'manager' ? '1.5px solid #00a651' : '1px solid #e2e8f0',
                  backgroundColor: activeQuickRole === 'manager' ? '#e8f8f0' : '#ffffff',
                  color: activeQuickRole === 'manager' ? '#00a651' : 'var(--text-muted, #4b5563)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <BarChart3 size={14} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Quản lý</span>
                </div>
                <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>Trang trại</span>
              </button>

              {/* Role 3: Admin */}
              <button
                type="button"
                onClick={() => handleSelectQuickRole('admin', 'admin@hydrosmart.farm')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: activeQuickRole === 'admin' ? '1.5px solid #00a651' : '1px solid #e2e8f0',
                  backgroundColor: activeQuickRole === 'admin' ? '#e8f8f0' : '#ffffff',
                  color: activeQuickRole === 'admin' ? '#00a651' : 'var(--text-muted, #4b5563)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <Shield size={14} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Admin</span>
                </div>
                <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>Hệ thống</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
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
              marginBottom: '18px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-main, #111827)',
                marginBottom: '6px'
              }}>
                Địa chỉ Email
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '42px',
                padding: '0 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
              }}>
                <Mail size={16} color="var(--text-disabled, #9ca3af)" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hydrosmart.farm"
                  required
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.875rem',
                    color: 'var(--text-main, #111827)',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
              }}>
                <label style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-main, #111827)'
                }}>
                  Mật khẩu
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Mật khẩu mẫu của các tài khoản là: HydroSmart123@');
                  }}
                  style={{
                    fontSize: '0.78rem',
                    color: '#00a651',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Quên mật khẩu?
                </a>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '42px',
                padding: '0 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}>
                <Lock size={16} color="var(--text-disabled, #9ca3af)" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.875rem',
                    color: 'var(--text-main, #111827)',
                    backgroundColor: 'transparent'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: 'var(--text-disabled, #9ca3af)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '6px',
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
              <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}</span>
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Footer Register Link */}
          <div style={{
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle, #edf0f3)',
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--text-subtle, #6b7280)'
          }}>
            Chưa có tài khoản kỹ sư?{' '}
            <Link
              to="/register"
              style={{
                color: '#00a651',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              Đăng ký tài khoản mới
            </Link>
          </div>
        </div>

        {/* Bottom Status & Security Badges matching Dashboard Footer */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '0.75rem',
            color: 'var(--text-subtle, #6b7280)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00a651' }} />
              Máy chủ: Trực tuyến
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} color="#00a651" />
              Mã hóa bảo mật JWT / bcrypt
            </span>
          </div>

          <div style={{
            fontSize: '0.72rem',
            color: 'var(--text-disabled, #9ca3af)'
          }}>
            HydroSmart © 2026 — Hệ thống Quản lý Trang trại Thủy canh Hồi lưu NFT
          </div>
        </div>
      </div>
    </div>
  );
};
