import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Check, 
  Bell, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Search,
  Droplets,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Alert } from '../types/farm';
import './AlertsView.css';

interface AlertsViewProps {
  alerts: Alert[];
  onAcknowledgeAlert: (id: string, by: string) => void;
  onResolveAlert: (id: string, by?: string, note?: string, metricVal?: number) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onAcknowledgeAlert,
  onResolveAlert,
}) => {
  const { user } = useAuth();
  const currentEngineerName = user?.fullName || 'Lê Thị Kỹ Sư Nông Học';
  const [filterStatus, setFilterStatus] = useState<string>('active'); // active, open, acknowledged, resolved, all
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterMetric, setFilterMetric] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [resolvedMetricVal, setResolvedMetricVal] = useState<string>('');
  const [resolveTarget, setResolveTarget] = useState<string | null>(null);

  // Counts
  const openCount = alerts.filter(a => a.status === 'open').length;
  const ackCount = alerts.filter(a => a.status === 'acknowledged').length;
  const emergencyCount = alerts.filter(a => a.severity === 'emergency' && a.status !== 'resolved').length;
  const criticalCount = alerts.filter(a => (a.severity === 'emergency' || a.severity === 'critical') && a.status !== 'resolved').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

  // Filtered alert list
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      // Status
      if (filterStatus === 'active') {
        if (a.status !== 'open' && a.status !== 'acknowledged') return false;
      } else if (filterStatus !== 'all') {
        if (a.status !== filterStatus) return false;
      }

      // Severity
      if (filterSeverity !== 'all' && a.severity !== filterSeverity) {
        return false;
      }

      // Metric
      if (filterMetric !== 'all' && a.metric !== filterMetric) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchMsg = a.message.toLowerCase().includes(q);
        const matchMetric = a.metric.toLowerCase().includes(q);
        const matchRes = a.reservoirId?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchMsg && !matchMetric && !matchRes) return false;
      }

      return true;
    });
  }, [alerts, filterStatus, filterSeverity, filterMetric, searchQuery]);

  return (
    <div className="alerts-container">
      
      {/* ========================================================
          1. HEADER: Synchronized with Dashboard & Reservoirs
          ======================================================== */}
      <div className="alerts-header">
        <div className="alerts-header-left">
          <div>
            <h1 className="alerts-title">
              <ShieldAlert size={22} color="#00a651" />
              Cảnh Báo Sinh Hóa
            </h1>
            <div className="alerts-subtitle">
              Giám sát sai lệch nồng độ EC, pH, nhiệt độ dung dịch và mực nước tuần hoàn
            </div>
          </div>
        </div>

        <div className="alerts-header-actions">
          <span className={`alerts-status-pill ${openCount > 0 ? 'danger' : 'success'}`}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: openCount > 0 ? '#ef4444' : '#16a34a'
            }} />
            {openCount > 0 ? `${openCount} sự cố cần xử lý` : 'Chỉ số an toàn'}
          </span>

          <Link
            to="/reservoirs"
            className="farmvista-btn-secondary"
            style={{ height: '34px', fontSize: '0.78rem', padding: '0 12px', textDecoration: 'none' }}
          >
            <Droplets size={14} color="#00a651" />
            <span>Bể dinh dưỡng</span>
          </Link>
        </div>
      </div>

      {/* ========================================================
          2. KPI CARDS: 4 Cards in Exact Synchronized SaaS Grid
          ======================================================== */}
      <div className="alerts-kpis">
        {/* Metric 1: Chưa xử lý */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'open' ? 'all' : 'open')}
          className={`alerts-kpi-card ${filterStatus === 'open' ? 'active' : ''}`}
        >
          <div className="alerts-kpi-top">
            <span className="alerts-kpi-label">Chưa Xử Lý</span>
            <div className="alerts-kpi-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <Bell size={17} />
            </div>
          </div>
          <div className="alerts-kpi-val" style={{ color: openCount > 0 ? '#dc2626' : '#0f172a' }}>
            {openCount}
          </div>
          <div className="alerts-kpi-meta">
            <span>Cần can thiệp</span>
            <span className="alerts-kpi-badge" style={{ backgroundColor: openCount > 0 ? '#fee2e2' : '#ecfdf5', color: openCount > 0 ? '#dc2626' : '#16a34a' }}>
              {openCount > 0 ? 'Ưu tiên cao' : 'Bình thường'}
            </span>
          </div>
        </div>

        {/* Metric 2: Đang tiếp nhận */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'acknowledged' ? 'all' : 'acknowledged')}
          className={`alerts-kpi-card ${filterStatus === 'acknowledged' ? 'active' : ''}`}
        >
          <div className="alerts-kpi-top">
            <span className="alerts-kpi-label">Đang Tiếp Nhận</span>
            <div className="alerts-kpi-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <Clock size={17} />
            </div>
          </div>
          <div className="alerts-kpi-val">
            {ackCount}
          </div>
          <div className="alerts-kpi-meta">
            <span>Theo dõi tại giàn</span>
            <span className="alerts-kpi-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
              Kỹ sư phụ trách
            </span>
          </div>
        </div>

        {/* Metric 3: Sự cố nghiêm trọng */}
        <div
          onClick={() => setFilterSeverity(filterSeverity === 'critical' ? 'all' : 'critical')}
          className={`alerts-kpi-card ${filterSeverity === 'critical' ? 'active' : ''}`}
        >
          <div className="alerts-kpi-top">
            <span className="alerts-kpi-label">Nghiêm Trọng</span>
            <div className="alerts-kpi-icon" style={{ backgroundColor: '#fff1f2', color: '#e11d48' }}>
              <AlertTriangle size={17} />
            </div>
          </div>
          <div className="alerts-kpi-val" style={{ color: criticalCount > 0 ? '#e11d48' : '#0f172a' }}>
            {criticalCount}
          </div>
          <div className="alerts-kpi-meta">
            <span>Rủi ro sốc rễ NFT</span>
            <span className="alerts-kpi-badge" style={{ backgroundColor: criticalCount > 0 ? '#ffe4e6' : '#ecfdf5', color: criticalCount > 0 ? '#e11d48' : '#16a34a' }}>
              {emergencyCount > 0 ? `${emergencyCount} Khẩn cấp!` : criticalCount > 0 ? 'Cần cân chỉnh' : 'An toàn'}
            </span>
          </div>
        </div>

        {/* Metric 4: Đã giải quyết */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'resolved' ? 'all' : 'resolved')}
          className={`alerts-kpi-card ${filterStatus === 'resolved' ? 'active' : ''}`}
        >
          <div className="alerts-kpi-top">
            <span className="alerts-kpi-label">Đã Khắc Phục</span>
            <div className="alerts-kpi-icon" style={{ backgroundColor: '#ecfdf5', color: '#16a34a' }}>
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="alerts-kpi-val">
            {resolvedCount}
          </div>
          <div className="alerts-kpi-meta">
            <span>Thông số về chuẩn</span>
            <span className="alerts-kpi-badge" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
              Đã tối ưu
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. FILTER TOOLBAR: Pill Tabs + Search & Filters
          ======================================================== */}
      <div className="alerts-toolbar">
        <div className="alerts-filters">
          {[
            { id: 'all', label: `Tất cả (${alerts.length})` },
            { id: 'active', label: `Cần xử lý (${openCount + ackCount})` },
            { id: 'open', label: `Chưa tiếp nhận (${openCount})` },
            { id: 'acknowledged', label: `Đang xử lý (${ackCount})` },
            { id: 'resolved', label: `Đã xong (${resolvedCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`alerts-filter-btn ${filterStatus === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="alerts-controls">
          <div className="alerts-search-box">
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              placeholder="Tìm cảnh báo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="alerts-search-input"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="farmvista-select-pill"
            style={{ borderRadius: '8px', height: '34px', fontSize: '0.75rem' }}
          >
            <option value="all">Mọi mức độ</option>
            <option value="emergency">Khẩn cấp</option>
            <option value="critical">Nghiêm trọng</option>
            <option value="warning">Cảnh báo</option>
            <option value="info">Thông tin</option>
          </select>

          <select
            value={filterMetric}
            onChange={(e) => setFilterMetric(e.target.value)}
            className="farmvista-select-pill"
            style={{ borderRadius: '8px', height: '34px', fontSize: '0.75rem' }}
          >
            <option value="all">Mọi chỉ số</option>
            <option value="EC">EC</option>
            <option value="pH">pH</option>
            <option value="Temp">Nhiệt nước</option>
            <option value="DO">Oxy DO</option>
            <option value="WaterLevel">Mực nước</option>
            <option value="System">Hệ thống</option>
          </select>
        </div>
      </div>

      {/* ========================================================
          4. CLEAN INCIDENT TABLE (Zero visual clutter)
          ======================================================== */}
      <div className="alerts-card">
        {filteredAlerts.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="alerts-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>Chỉ Số & Mức Độ</th>
                  <th>Nội Dung Sự Cố & Vị Trí</th>
                  <th style={{ minWidth: '220px', whiteSpace: 'nowrap' }}>Số Đo vs Ngưỡng Chuẩn</th>
                  <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>Trạng Thái</th>
                  <th style={{ minWidth: '160px', textAlign: 'right', whiteSpace: 'nowrap' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => {
                  const isExpanded = expandedId === alert.id;
                  const isResolvingThis = resolveTarget === alert.id;

                  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
                    open: {
                      label: 'Chưa xử lý',
                      bg: alert.severity === 'emergency' ? '#fee2e2' : '#fef2f2',
                      color: alert.severity === 'emergency' ? '#991b1b' : '#b91c1c'
                    },
                    acknowledged: {
                      label: 'Đang xử lý',
                      bg: '#fef3c7',
                      color: '#b45309'
                    },
                    resolved: {
                      label: 'Đã giải quyết',
                      bg: '#ecfdf5',
                      color: '#065f46'
                    },
                    escalated: {
                      label: 'Khẩn cấp',
                      bg: '#fee2e2',
                      color: '#991b1b'
                    }
                  };
                  const statusStyle = statusConfig[alert.status] || { label: alert.status, bg: '#f1f5f9', color: '#475569' };

                  return (
                    <React.Fragment key={alert.id}>
                      <tr 
                        className={`${alert.severity === 'emergency' && alert.status === 'open' ? 'row-emergency' : ''} ${alert.status === 'resolved' ? 'row-resolved' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                      >
                        {/* Cột 1: Chỉ số & Mức độ */}
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div className={`alert-type-badge ${alert.status === 'resolved' ? 'resolved' : alert.severity}`}>
                            <span>{alert.metric}</span>
                            <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>•</span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                              {alert.severity === 'emergency' ? 'Khẩn cấp' : alert.severity === 'critical' ? 'Nghiêm trọng' : alert.severity === 'warning' ? 'Cảnh báo' : 'Thông tin'}
                            </span>
                          </div>
                        </td>

                        {/* Cột 2: Nội dung & Vị trí */}
                        <td>
                          <div className="alert-title-text">{alert.title}</div>
                          <div className="alert-location-sub">
                            <span>{alert.reservoirId === 'res-01' ? 'Bể 01 (Tầng 1)' : alert.reservoirId === 'res-02' ? 'Bể 02 (Tầng 2)' : 'Toàn giàn'}</span>
                            {alert.zoneId && <span>• Giàn {alert.zoneId.replace('zone-', '').toUpperCase()}</span>}
                            <span>• {alert.timestamp}</span>
                          </div>
                        </td>

                        {/* Cột 3: Giá trị đo đạc vs Ngưỡng chuẩn */}
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {alert.actualValue !== undefined && alert.thresholdValue !== undefined ? (
                            <div className="alert-val-box">
                              <span style={{ color: alert.severity === 'emergency' || alert.severity === 'critical' ? '#dc2626' : '#d97706', fontWeight: 700 }}>
                                {alert.actualValue} {alert.unit || ''}
                              </span>
                              <span style={{ color: '#cbd5e1' }}>/</span>
                              <span style={{ color: '#64748b' }}>
                                Chuẩn {alert.thresholdValue} {alert.unit || ''}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Theo dõi định kỳ</span>
                          )}
                        </td>

                        {/* Cột 4: Trạng thái */}
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.color,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {statusStyle.label}
                          </span>
                        </td>

                        {/* Cột 5: Thao tác nhanh */}
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                            {alert.status === 'open' && (
                              <button
                                onClick={() => onAcknowledgeAlert(alert.id, currentEngineerName)}
                                className="alert-btn-action ack"
                                title="Tiếp nhận sự cố"
                              >
                                <Clock size={12} />
                                <span>Tiếp nhận</span>
                              </button>
                            )}

                            {alert.status !== 'resolved' ? (
                              <button
                                onClick={() => {
                                  setResolveTarget(resolveTarget === alert.id ? null : alert.id);
                                  setResolveNote('');
                                  setResolvedMetricVal(
                                    alert.metric === 'pH' ? '5.80' :
                                    alert.metric === 'EC' ? '1.70' :
                                    alert.metric === 'Temp' ? '22.0' : ''
                                  );
                                  setExpandedId(alert.id);
                                }}
                                className="alert-btn-action resolve"
                                title="Giải quyết sự cố"
                              >
                                <Check size={12} />
                                <span>Xử lý</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <CheckCircle2 size={13} />
                                <span>Đã xong</span>
                              </span>
                            )}

                            <button
                              onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#94a3b8',
                                padding: '4px',
                                display: 'flex'
                              }}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Drawer: Khuyến nghị & Ghi chú xử lý */}
                      {isExpanded && (
                        <tr className="alert-expand-row">
                          <td colSpan={5}>
                            <div className="alert-expand-content">
                              {alert.suggestedAction && (
                                <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                                  <strong style={{ color: '#0f172a' }}>Khuyến nghị can thiệp: </strong>
                                  {alert.suggestedAction}
                                </div>
                              )}

                              {alert.resolutionNote && (
                                <div style={{ fontSize: '0.75rem', color: '#166534', backgroundColor: '#f0fdf4', padding: '6px 10px', borderRadius: '6px' }}>
                                  <strong>Đã xử lý ({alert.resolvedBy} • {alert.resolvedAt}): </strong>
                                  {alert.resolutionNote}
                                </div>
                              )}

                              {/* Form ghi chú xử lý tại chỗ */}
                              {isResolvingThis && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    {alert.reservoirId && (alert.metric === 'pH' || alert.metric === 'EC' || alert.metric === 'Temp' || alert.metric === 'WaterTemp') && (
                                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>
                                        <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155' }}>
                                          Số đo {alert.metric} mới:
                                        </span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={resolvedMetricVal}
                                          onChange={(e) => setResolvedMetricVal(e.target.value)}
                                          placeholder={alert.metric === 'pH' ? '5.80' : '1.70'}
                                          style={{
                                            width: '65px',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '4px',
                                            padding: '3px 6px',
                                            fontSize: '0.78rem',
                                            fontWeight: 800,
                                            color: '#00a651',
                                            textAlign: 'center'
                                          }}
                                        />
                                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{alert.unit || ''}</span>
                                      </div>
                                    )}
                                    <input
                                      type="text"
                                      placeholder="Ghi chú xử lý (VD: Đã châm 150ml axit Phosphoric...)..."
                                      value={resolveNote}
                                      onChange={(e) => setResolveNote(e.target.value)}
                                      style={{
                                        flex: 1,
                                        minWidth: '220px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        padding: '6px 10px',
                                        fontSize: '0.78rem',
                                        outline: 'none'
                                      }}
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => {
                                        const finalMetric = resolvedMetricVal !== '' ? parseFloat(resolvedMetricVal) : undefined;
                                        onResolveAlert(alert.id, currentEngineerName, resolveNote || 'Đã kiểm tra và điều chỉnh thông số chuẩn.', finalMetric);
                                        setResolveTarget(null);
                                      }}
                                      className="farmvista-btn-green"
                                      style={{ height: '30px', fontSize: '0.75rem', padding: '0 12px' }}
                                    >
                                      Lưu kết quả
                                    </button>
                                    <button
                                      onClick={() => setResolveTarget(null)}
                                      className="farmvista-btn-secondary"
                                      style={{ height: '30px', fontSize: '0.75rem', padding: '0 10px' }}
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
            <CheckCircle2 size={36} color="#00a651" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
              Không Có Sự Cố Nào
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
              Tất cả các thông số hóa sinh và vi khí hậu đều trong ngưỡng an toàn.
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AlertsView;
