import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutGrid, 
  Sprout, 
  Droplets, 
  CloudSun, 
  Settings2, 
  ClipboardCheck, 
  LogOut
} from 'lucide-react';

interface SidebarProps {
  unreadAlertCount: number;
  onResetData: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  unreadAlertCount,
  onResetData
}) => {
  const navItems = [
    { path: '/dashboard', label: 'Bảng điều khiển', icon: LayoutGrid },
    { path: '/batches', label: 'Quản lý lô trồng', icon: Sprout },
    { path: '/reservoirs', label: 'Bể nước & Dinh dưỡng', icon: Droplets },
    { path: '/forecast', label: 'Dự báo năng suất AI', icon: CloudSun },
    { path: '/harvest', label: 'Nhật ký thu hoạch', icon: ClipboardCheck },
    { path: '/alerts', label: 'Cảnh báo sinh hóa', icon: Settings2, badge: unreadAlertCount },
  ];

  return (
    <aside className="app-sidebar" style={{
      width: '240px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxSizing: 'border-box'
    }}>
      {/* Brand Header: HydroSmart with leaf logo */}
      <div style={{
        height: '68px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        {/* HydroSmart Green Circle Icon */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '2px solid #00a651',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00a651'
        }}>
          <Sprout size={18} strokeWidth={2.5} />
        </div>
        <span style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: '#00a651',
          letterSpacing: '-0.02em'
        }}>
          HydroSmart
        </span>
      </div>

      {/* Main Nav Items List */}
      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              style={({ isActive }) => ({
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? '#e8f8f0' : 'transparent',
                color: isActive ? '#00a651' : 'var(--text-subtle)',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.85rem',
                transition: 'background-color 0.12s ease, color 0.12s ease'
              })}
            >
              {({ isActive }) => (
                <>
                  {/* Left indicator bar on active item */}
                  {isActive && (
                    <span style={{
                      position: 'absolute',
                      left: '-12px',
                      top: '4px',
                      bottom: '4px',
                      width: '4px',
                      backgroundColor: '#00a651',
                      borderRadius: '0 4px 4px 0'
                    }} />
                  )}
                  <Icon size={18} color={isActive ? '#00a651' : 'var(--text-subtle)'} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      lineHeight: 1
                    }}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Footer: Log Out */}
      <div style={{ padding: '16px 14px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => {
            if (window.confirm('Khôi phục lại dữ liệu trang trại ban đầu?')) {
              onResetData();
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '9px 14px',
            border: 'none',
            background: 'transparent',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-subtle)',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fee2e2';
            e.currentTarget.style.color = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-subtle)';
          }}
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

