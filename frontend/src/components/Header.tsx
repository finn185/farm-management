import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, Download, ChevronDown } from 'lucide-react';

interface HeaderProps {
  unreadAlertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  unreadAlertCount: _unreadAlertCount
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="app-header" style={{
      height: '68px',
      padding: '0 32px',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#ffffff',
      gap: '20px'
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
          {/* Active green notification dot */}
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

        {/* User Profile Chip: Nguyen Van An, Farm Manager */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 8px',
          cursor: 'pointer'
        }}>
          <img
            src="/avatar_albert.jpg"
            alt="Nguyễn Văn An"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid var(--border-subtle)'
            }}
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
              Nguyễn Văn An
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', lineHeight: 1.2, marginTop: '2px' }}>
              Quản lý Trang trại
            </span>
          </div>
          <ChevronDown size={14} color="var(--text-subtle)" style={{ marginLeft: '2px' }} />
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

