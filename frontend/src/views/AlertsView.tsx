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
  ExternalLink,
  Droplets,
  Sprout
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Alert } from '../types/farm';

interface AlertsViewProps {
  alerts: Alert[];
  onAcknowledgeAlert: (id: string, by: string) => void;
  onResolveAlert: (id: string, by?: string, note?: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onAcknowledgeAlert,
  onResolveAlert,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('active'); // active, open, acknowledged, resolved, all
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [resolveTarget, setResolveTarget] = useState<string | null>(null);

  // Counts
  const openCount = alerts.filter(a => a.status === 'open').length;
  const ackCount = alerts.filter(a => a.status === 'acknowledged').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;
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
  }, [alerts, filterStatus, filterSeverity, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header tinh gọn */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.005em', margin: 0 }}>
            Cảnh Báo Sinh Hóa
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-subtle)', marginTop: '4px', margin: '4px 0 0 0' }}>
            Giám sát độ lệch chỉ số EC, pH, nhiệt độ dung dịch và nồng độ oxy hòa tan NFT.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: openCount > 0 ? '#b91c1c' : '#15803d',
            backgroundColor: openCount > 0 ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${openCount > 0 ? '#fecaca' : '#dcfce7'}`,
            borderRadius: 'var(--radius-full)',
            padding: '5px 12px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: openCount > 0 ? '#ef4444' : '#16a34a'
            }} />
            {openCount > 0 ? `${openCount} sự cố cần can thiệp` : 'Chỉ số bình thường'}
          </span>
        </div>
      </div>

      {/* ========================================================
          2. KPI CARDS (4 Cards in a Row - Exact Match with Batches/Dashboard)
          ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        {/* Metric 1: Chưa xử lý */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'open' ? 'all' : 'open')}
          className="farmvista-card"
          style={{
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            border: filterStatus === 'open' ? '1.5px solid #00a651' : '1px solid var(--border-subtle)',
            backgroundColor: '#ffffff',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#e8f8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00a651',
            flexShrink: 0
          }}>
            <Bell size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>
              Sự cố chưa xử lý
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              {openCount} sự cố
            </div>
            <div style={{ fontSize: '0.72rem', color: '#00a651', fontWeight: 600, marginTop: '4px' }}>
              {openCount > 0 ? 'Cần tiếp nhận hiện trường' : 'Hệ thống an toàn'}
            </div>
          </div>
        </div>

        {/* Metric 2: Đang xử lý */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'acknowledged' ? 'all' : 'acknowledged')}
          className="farmvista-card"
          style={{
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            border: filterStatus === 'acknowledged' ? '1.5px solid #00a651' : '1px solid var(--border-subtle)',
            backgroundColor: '#ffffff',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#e8f8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00a651',
            flexShrink: 0
          }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>
              Giàn đang theo dõi
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              {ackCount} sự cố
            </div>
            <div style={{ fontSize: '0.72rem', color: '#00a651', fontWeight: 600, marginTop: '4px' }}>
              Kỹ sư đang xử lý tại chỗ
            </div>
          </div>
        </div>

        {/* Metric 3: Sự cố nghiêm trọng */}
        <div
          onClick={() => setFilterSeverity(filterSeverity === 'critical' ? 'all' : 'critical')}
          className="farmvista-card"
          style={{
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            border: filterSeverity === 'critical' ? '1.5px solid #00a651' : '1px solid var(--border-subtle)',
            backgroundColor: '#ffffff',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#e8f8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00a651',
            flexShrink: 0
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>
              Sự cố nghiêm trọng
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              {criticalCount} sự cố
            </div>
            <div style={{ fontSize: '0.72rem', color: '#00a651', fontWeight: 600, marginTop: '4px' }}>
              {criticalCount > 0 ? 'Nguy cơ sốc rễ xà lách' : 'Không có rủi ro cao'}
            </div>
          </div>
        </div>

        {/* Metric 4: Đã khắc phục xong */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'resolved' ? 'all' : 'resolved')}
          className="farmvista-card"
          style={{
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            border: filterStatus === 'resolved' ? '1.5px solid #00a651' : '1px solid var(--border-subtle)',
            backgroundColor: '#ffffff',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#e8f8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00a651',
            flexShrink: 0
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>
              Đã khắc phục xong
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginTop: '2px' }}>
              {resolvedCount} sự cố
            </div>
            <div style={{ fontSize: '0.72rem', color: '#00a651', fontWeight: 600, marginTop: '4px' }}>
              Chỉ số đã về mức tối ưu
            </div>
          </div>
        </div>
      </div>

      {/* 3. Toolbar lọc tối giản */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'active', label: `Cần xử lý (${openCount + ackCount})` },
            { id: 'open', label: `Chưa tiếp nhận (${openCount})` },
            { id: 'acknowledged', label: `Đang xử lý (${ackCount})` },
            { id: 'resolved', label: `Đã xong (${resolvedCount})` },
            { id: 'all', label: `Tất cả (${alerts.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: filterStatus === tab.id ? 'none' : '1px solid var(--border-medium)',
                backgroundColor: filterStatus === tab.id ? '#00a651' : '#ffffff',
                color: filterStatus === tab.id ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: filterStatus === tab.id ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Severity Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            padding: '5px 10px',
            width: '200px'
          }}>
            <Search size={14} color="var(--text-disabled)" />
            <input
              type="text"
              placeholder="Tìm cảnh báo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '0.78rem', color: 'var(--text-main)', width: '100%', background: 'transparent' }}
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="farmvista-select-pill"
            style={{ borderRadius: '8px', height: '32px', fontSize: '0.75rem' }}
          >
            <option value="all">Mọi mức độ</option>
            <option value="critical">Nghiêm trọng</option>
            <option value="warning">Cảnh báo</option>
            <option value="info">Thông tin</option>
          </select>
        </div>
      </div>

      {/* 4. Danh sách cảnh báo: Thiết kế bảng card thanh lịch, màu sắc trung tính nhẹ nhàng */}
      <div className="farmvista-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredAlerts.length > 0 ? (
          <div>
            {filteredAlerts.map((alert, idx) => {
              const isExpanded = expandedId === alert.id;
              const isResolvingThis = resolveTarget === alert.id;
              const isLast = idx === filteredAlerts.length - 1;

              // Simple subtle status style
              const statusLabel = 
                alert.status === 'open' ? 'Chưa xử lý' :
                alert.status === 'acknowledged' ? 'Đang xử lý' : 'Đã giải quyết';
              
              const statusBg = 
                alert.status === 'open' ? '#fef2f2' :
                alert.status === 'acknowledged' ? '#fffbeb' : '#f0fdf4';
              
              const statusColor = 
                alert.status === 'open' ? '#b91c1c' :
                alert.status === 'acknowledged' ? '#b45309' : '#15803d';

              return (
                <div
                  key={alert.id}
                  style={{
                    borderBottom: isLast && !isExpanded ? 'none' : '1px solid var(--border-subtle)',
                    backgroundColor: alert.status === 'resolved' ? '#fafafa' : '#ffffff',
                    transition: 'background-color 0.12s ease'
                  }}
                >
                  {/* Alert Main Row */}
                  <div
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                  >
                    {/* Status Dot */}
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: alert.severity === 'critical' ? '#ef4444' : alert.severity === 'warning' ? '#f59e0b' : '#3b82f6',
                        flexShrink: 0
                      }}
                      title={`Mức độ: ${alert.severity}`}
                    />

                    {/* Metric Tag (Neutral Gray Pill) */}
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      backgroundColor: '#f1f5f9',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      flexShrink: 0
                    }}>
                      {alert.metric}
                    </span>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          color: 'var(--text-main)'
                        }}>
                          {alert.title}
                        </span>

                        {/* Location Link */}
                        {alert.reservoirId && (
                          <Link
                            to="/reservoirs"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              color: '#00a651',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <span>{alert.reservoirId === 'res-01' ? 'Bể 01' : 'Bể 02'}</span>
                            <ExternalLink size={10} />
                          </Link>
                        )}

                        {alert.batchId && (
                          <Link
                            to="/batches"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              color: '#64748b',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <span>{alert.batchId}</span>
                            <ExternalLink size={10} />
                          </Link>
                        )}

                        {alert.zoneId && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: '#0369a1',
                              backgroundColor: '#e0f2fe',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <span>Giàn {alert.zoneId.replace('zone-', '').toUpperCase()}</span>
                          </span>
                        )}
                      </div>

                      <div style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-subtle)',
                        marginTop: '3px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: isExpanded ? 'normal' : 'nowrap'
                      }}>
                        {alert.message}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: statusColor,
                      backgroundColor: statusBg,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      flexShrink: 0
                    }}>
                      {statusLabel}
                    </span>

                    {/* Timestamp */}
                    <span style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-disabled)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      {alert.timestamp}
                    </span>

                    {/* Expand Chevron */}
                    <div style={{ color: 'var(--text-disabled)', flexShrink: 0 }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div style={{
                      padding: '0 20px 18px 44px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      {/* Suggested Action Box (Neutral slate background) */}
                      <div style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '0.78rem',
                        color: 'var(--text-main)',
                        lineHeight: 1.45
                      }}>
                        <strong style={{ color: '#0f172a' }}>Khuyến nghị xử lý:</strong> {alert.suggestedAction}
                      </div>

                      {/* Resolution note if already resolved */}
                      {alert.resolutionNote && (
                        <div style={{
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #dcfce7',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.78rem',
                          color: '#166534'
                        }}>
                          <strong>Đã xử lý ({alert.resolvedBy} - {alert.resolvedAt}):</strong> {alert.resolutionNote}
                        </div>
                      )}

                      {/* Bottom action row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                          {alert.assignedTo ? (
                            <span>Phụ trách: <strong>{alert.assignedTo}</strong> {alert.acknowledgedAt && `· Tiếp nhận lúc ${alert.acknowledgedAt}`}</span>
                          ) : (
                            <span>Chưa có người tiếp nhận</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {(alert.metric === 'EC' || alert.metric === 'pH' || alert.metric === 'Nutrient') && alert.status !== 'resolved' && (
                            <Link
                              to="/reservoirs"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', height: '30px', display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
                            >
                              <Droplets size={12} color="#00a651" /> Bù Dinh Dưỡng
                            </Link>
                          )}

                          {(alert.title.includes('thu hoạch') || alert.metric === 'System') && alert.status !== 'resolved' && (
                            <Link
                              to="/harvest"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', height: '30px', display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
                            >
                              <Sprout size={12} color="#16a34a" /> Thu Hoạch
                            </Link>
                          )}

                          {alert.status === 'open' && (
                            <button
                              onClick={() => onAcknowledgeAlert(alert.id, 'Kỹ sư Nông nghiệp')}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', height: '30px' }}
                            >
                              <Clock size={12} /> Tiếp nhận
                            </button>
                          )}

                          {(alert.status === 'open' || alert.status === 'acknowledged') && !isResolvingThis && (
                            <button
                              onClick={() => {
                                setResolveTarget(alert.id);
                                setResolveNote('');
                              }}
                              className="farmvista-btn-green"
                              style={{ fontSize: '0.75rem', height: '30px', padding: '0 12px' }}
                            >
                              <Check size={13} /> Giải quyết
                            </button>
                          )}

                          {isResolvingThis && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="text"
                                placeholder="Ghi chú xử lý (VD: đã châm 30L nước)..."
                                value={resolveNote}
                                onChange={(e) => setResolveNote(e.target.value)}
                                style={{
                                  border: '1px solid var(--border-medium)',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  fontSize: '0.75rem',
                                  width: '260px',
                                  outline: 'none'
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  onResolveAlert(alert.id, 'Kỹ sư Nông nghiệp', resolveNote || 'Đã kiểm tra và điều chỉnh thông số.');
                                  setResolveTarget(null);
                                }}
                                className="farmvista-btn-green"
                                style={{ fontSize: '0.72rem', height: '28px', padding: '0 10px' }}
                              >
                                Lưu
                              </button>
                              <button
                                onClick={() => setResolveTarget(null)}
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: '0.72rem', height: '28px' }}
                              >
                                Hủy
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-subtle)' }}>
            <CheckCircle2 size={32} color="#00a651" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Không có sự cố nào
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Tất cả các thông số đang nằm trong giới hạn an toàn.
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AlertsView;
