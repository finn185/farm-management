import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Download, ChevronDown, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  unreadAlertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  unreadAlertCount: _unreadAlertCount
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/login');
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Quản Trị Viên', color: '#7c3aed', bg: '#f5f3ff' };
      case 'FARM_MANAGER':
        return { label: 'Quản Lý Trang Trại', color: '#0284c7', bg: '#f0f9ff' };
      case 'AGRONOMIST':
        return { label: 'Kỹ Sư Nông Học', color: '#059669', bg: '#ecfdf5' };
      case 'OPERATOR':
        return { label: 'Kỹ Thuật Viên', color: '#d97706', bg: '#fffbeb' };
      default:
        return { label: 'Kỹ Sư Vận Hành', color: '#00a651', bg: '#e6f7ee' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <header className="app-header" style={{
      height: '68px',
      padding: '0 32px',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#ffffff',
      gap: '20px',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Search Bar - HydroSmart Pill Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: '#ffffff',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-full)',
        padding: '8px 18px',
        width: '380px',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        <Search size={17} color="var(--text-disabled)" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm lô cây, bể dinh dưỡng, cảnh báo, báo cáo..."
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: '0.8125rem',
            color: 'var(--text-main)',
            background: 'transparent'
          }}
        />
      </div>

      {/* Right Actions: Notifications, Profile, Export */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        {/* Notification Bell Button */}
        <Link
          to="/alerts"
          style={{
            position: 'relative',
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-xs)'
          }}
          title="Thông báo & Cảnh báo an toàn sinh hóa"
        >
          <Bell size={18} color="var(--text-muted)" />
          <span style={{
            position: 'absolute',
            top: '7px',
            right: '8px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#00a651',
            border: '1.5px solid #ffffff'
          }} />
        </Link>

        {/* User Profile Chip with Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 10px',
              borderRadius: '10px',
              cursor: 'pointer',
              backgroundColor: showDropdown ? '#f4f8f5' : 'transparent',
              transition: 'background-color 0.15s ease'
            }}
          >
            {/* User Initials Avatar or photo */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: roleInfo.bg,
              color: roleInfo.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              border: `1.5px solid ${roleInfo.color}30`
            }}>
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.35, letterSpacing: '0.01em' }}>
                {user?.fullName || 'Người Dùng'}
              </span>
              <span style={{
                fontSize: '0.72rem',
                color: roleInfo.color,
                fontWeight: 600,
                lineHeight: 1.35,
                marginTop: '1px',
                letterSpacing: '0.01em'
              }}>
                {roleInfo.label}
              </span>
            </div>
            <ChevronDown size={14} color="var(--text-subtle)" style={{ marginLeft: '2px' }} />
          </div>

          {/* Profile Dropdown Menu */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              width: '260px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5ebe7',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              zIndex: 100
            }}>
              {/* Account summary banner */}
              <div style={{
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: '#f8faf9',
                border: '1px solid #edf2ef'
              }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1a2e22' }}>
                  {user?.fullName}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#688071', wordBreak: 'break-all' }}>
                  {user?.email}
                </div>
                <div style={{
                  marginTop: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: roleInfo.bg,
                  color: roleInfo.color
                }}>
                  <Shield size={11} />
                  {roleInfo.label}
                </div>
              </div>

              {/* Menu items */}
              <div style={{ height: '1px', backgroundColor: '#e5ebe7', margin: '4px 0' }} />

              <button
                type="button"
                onClick={() => {
                  navigate('/profile');
                  setShowDropdown(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#2d4234',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f4f8f5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <UserIcon size={15} color="#688071" />
                <span>Hồ sơ cá nhân</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#dc2626',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <LogOut size={15} color="#dc2626" />
                <span>Đăng xuất khỏi hệ thống</span>
              </button>
            </div>
          )}
        </div>

        {/* Export Button in FarmVista Green */}
        <button
          onClick={() => {
            alert('Đã xuất báo cáo tổng hợp trang trại thủy canh (định dạng PDF/Excel)!');
          }}
          style={{
            backgroundColor: '#00a651',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#008f45')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#00a651')}
        >
          <Download size={15} />
          <span>Xuất Báo Cáo</span>
        </button>
      </div>
    </header>
  );
};
