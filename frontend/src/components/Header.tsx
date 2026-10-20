import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Download, ChevronDown, LogOut, User as UserIcon, Shield, Sprout, Droplets, AlertTriangle, Compass, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { farmStore } from '../mock/store';
import type { CropBatch, Reservoir, Alert, HarvestRecord } from '../types/farm';

interface HeaderProps {
  unreadAlertCount: number;
  batches?: CropBatch[];
  reservoirs?: Reservoir[];
  alerts?: Alert[];
  harvests?: HarvestRecord[];
}

const QUICK_PAGES = [
  { label: 'Bảng điều khiển (Dashboard)', path: '/dashboard', keywords: 'dashboard bang dieu khien tong quan' },
  { label: 'Quản lý lô trồng (Crop Batches)', path: '/batches', keywords: 'batches lo trong cay xalach gieo hat' },
  { label: 'Bể nước & Dinh dưỡng (Reservoirs)', path: '/reservoirs', keywords: 'reservoirs be nuoc dinh duong ph ec' },
  { label: 'Dự báo năng suất AI (AI Forecast)', path: '/forecast', keywords: 'forecast ai du bao nang suat sinh khoi' },
  { label: 'Nhật ký thu hoạch (Harvest Log)', path: '/harvest', keywords: 'harvest thu hoach san luong doanh thu' },
  { label: 'Cảnh báo sinh hóa (Alerts)', path: '/alerts', keywords: 'alerts canh bao su co an toan' },
  { label: 'Trạm giả lập IoT (Simulator)', path: '/simulator', keywords: 'simulator gia lap iot esp32 sensor' },
  { label: 'Hồ sơ cá nhân (Profile)', path: '/profile', keywords: 'profile ho so ca nhan tai khoan mat khau' }
];

export const Header: React.FC<HeaderProps> = ({
  unreadAlertCount,
  batches: batchesProp,
  reservoirs: reservoirsProp,
  alerts: alertsProp,
  harvests: harvestsProp
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const batches = batchesProp && batchesProp.length > 0 ? batchesProp : farmStore.getBatches();
  const reservoirs = reservoirsProp && reservoirsProp.length > 0 ? reservoirsProp : farmStore.getReservoirs();
  const alerts = alertsProp && alertsProp.length > 0 ? alertsProp : farmStore.getAlerts();
  const harvests = harvestsProp && harvestsProp.length > 0 ? harvestsProp : farmStore.getHarvests();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: Array<{ type: 'page' | 'batch' | 'reservoir' | 'alert'; title: string; subtitle: string; path: string }> = [];

    QUICK_PAGES.forEach(p => {
      if (p.label.toLowerCase().includes(q) || p.keywords.includes(q)) {
        results.push({ type: 'page', title: p.label, subtitle: `Đi tới trang ${p.path}`, path: p.path });
      }
    });

    batches.forEach(b => {
      if (b.batchCode.toLowerCase().includes(q) || b.cultivarName.toLowerCase().includes(q) || (b.zoneCode && b.zoneCode.toLowerCase().includes(q))) {
        results.push({
          type: 'batch',
          title: `${b.batchCode} — ${b.cultivarName}`,
          subtitle: `Giàn ${b.zoneCode || 'A1'} • ${b.currentQuantity || b.plantQuantity} cây (${b.status === 'active' ? 'Đang trồng' : 'Đã thu'})`,
          path: '/batches'
        });
      }
    });

    reservoirs.forEach(r => {
      if (r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)) {
        results.push({
          type: 'reservoir',
          title: r.name,
          subtitle: `pH ${r.currentPh.toFixed(2)} • EC ${r.currentEc.toFixed(2)} mS/cm • ${r.currentWaterTemp.toFixed(1)}°C`,
          path: '/reservoirs'
        });
      }
    });

    alerts.forEach(a => {
      if (a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q) || a.metric.toLowerCase().includes(q)) {
        results.push({
          type: 'alert',
          title: a.title,
          subtitle: `[${a.severity.toUpperCase()}] ${a.metric} • ${a.status === 'resolved' ? 'Đã xử lý' : 'Đang mở'}`,
          path: '/alerts'
        });
      }
    });

    return results.slice(0, 8);
  }, [searchQuery, batches, reservoirs, alerts]);

  const handleSelectSearchResult = (path: string) => {
    navigate(path);
    setShowSearchDropdown(false);
    setSearchQuery('');
  };

  const handleExportSummaryReport = () => {
    const today = new Date().toISOString().split('T')[0];
    const lines: string[] = [
      'BAO CAO TONG HOP TRANG TRAI THUY CANH HYDROSMART',
      `Ngay xuat bao cao,${today}`,
      `Nguoi xuat,${user?.fullName || 'Quan tri vien'}`,
      '',
      '1. DANH SACH LO CAY TRONG',
      'Ma Lo,Giong Cay,Phan Khu,So Cay Hien Tai,Ngay Gieo,Du Kien Thu Hoach,Trang Thai'
    ];

    batches.forEach(b => {
      lines.push(`${b.batchCode},"${b.cultivarName}",${b.zoneCode || 'NFT'},${b.currentQuantity || b.plantQuantity},${b.seedDate},${b.expectedHarvestDate},${b.status}`);
    });

    lines.push('', '2. TRANG THAI BE DINH DUONG TUAN HOAN');
    lines.push('Ma Be,Ten Be,The Tich (L),pH,EC (mS/cm),Nhiet Do Nuoc (C),DO (mg/L)');
    reservoirs.forEach(r => {
      lines.push(`${r.id},"${r.name}",${r.currentVolumeLiters}/${r.capacityLiters},${r.currentPh},${r.currentEc},${r.currentWaterTemp},${r.currentDo ?? 6.8}`);
    });

    lines.push('', '3. NHAT KY THU HOACH GAN NHAT');
    lines.push('Ma Lo,Giong Cay,Ngay Thu Hoach,So Cay Thu,San Luong (kg),Hang,Doanh Thu (VND)');
    harvests.forEach(h => {
      const rev = h.totalRevenueVnd || h.totalWeightKg * (h.unitPriceVnd || 45000);
      lines.push(`${h.batchCode},"${h.cultivarName}",${h.harvestDate},${h.harvestedPlants},${h.totalWeightKg},${h.grade},${rev}`);
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BaoCao_TongHop_HydroSmart_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(
      'Đã xuất báo cáo tổng hợp',
      `Tải xuống thành công BaoCao_TongHop_HydroSmart_${today}.csv`,
      'success'
    );
  };

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
      <div ref={searchRef} style={{ position: 'relative', width: '380px', maxWidth: '100%' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#ffffff',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-full)',
          padding: '8px 18px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <Search size={17} color="var(--text-disabled)" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setShowSearchDropdown(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchResults.length > 0) {
                handleSelectSearchResult(searchResults[0].path);
              } else if (e.key === 'Escape') {
                setShowSearchDropdown(false);
              }
            }}
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
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {showSearchDropdown && searchQuery.trim().length > 0 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)',
            border: '1px solid #e2e8f0',
            padding: '8px',
            zIndex: 200,
            maxHeight: '340px',
            overflowY: 'auto'
          }}>
            {searchResults.length === 0 ? (
              <div style={{ padding: '14px', textAlign: 'center', fontSize: '0.8125rem', color: '#64748b' }}>
                Không tìm thấy kết quả phù hợp cho "{searchQuery}"
              </div>
            ) : (
              searchResults.map((item, idx) => (
                <button
                  key={`${item.type}-${idx}`}
                  type="button"
                  onClick={() => handleSelectSearchResult(item.path)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: item.type === 'batch' ? '#ecfdf5' : item.type === 'reservoir' ? '#f0f9ff' : item.type === 'alert' ? '#fef2f2' : '#f8fafc',
                    color: item.type === 'batch' ? '#16a34a' : item.type === 'reservoir' ? '#0284c7' : item.type === 'alert' ? '#dc2626' : '#475569',
                    flexShrink: 0
                  }}>
                    {item.type === 'batch' ? <Sprout size={14} /> : item.type === 'reservoir' ? <Droplets size={14} /> : item.type === 'alert' ? <AlertTriangle size={14} /> : <Compass size={14} />}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.subtitle}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
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
          {unreadAlertCount > 0 ? (
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              minWidth: '18px',
              height: '18px',
              padding: '0 4px',
              borderRadius: '999px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #ffffff'
            }}>
              {unreadAlertCount}
            </span>
          ) : (
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
          )}
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
          onClick={handleExportSummaryReport}
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
