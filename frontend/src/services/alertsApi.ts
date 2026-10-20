import type { Alert } from '../types/farm';
import { farmStore } from '../mock/store';

const API_BASE_URL = 'http://localhost:5000/api/v1/alerts';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('hydrosmart_token') || localStorage.getItem('hydrosmart_auth_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const alertsApi = {
  async getAlerts(filters?: {
    status?: string;
    severity?: string;
    metric?: string;
    reservoirId?: string;
  }): Promise<Alert[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.severity) params.append('severity', filters.severity);
      if (filters?.metric) params.append('metric', filters.metric);
      if (filters?.reservoirId) params.append('reservoirId', filters.reservoirId);

      const res = await fetch(`${API_BASE_URL}?${params.toString()}`, {
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data.map((item: any) => ({
            ...item,
            timestamp: item.createdAt ? new Date(item.createdAt).toISOString().replace('T', ' ').substring(0, 16) : item.timestamp || '',
            resolved: item.status === 'resolved'
          }));
        }
      }
    } catch {
      // Offline fallback
    }

    let list = farmStore.getAlerts();
    if (filters?.status && filters.status !== 'all') {
      list = list.filter(a => a.status === filters.status);
    }
    if (filters?.severity && filters.severity !== 'all') {
      list = list.filter(a => a.severity === filters.severity);
    }
    if (filters?.metric) {
      list = list.filter(a => a.metric === filters.metric);
    }
    if (filters?.reservoirId) {
      list = list.filter(a => a.reservoirId === filters.reservoirId);
    }
    return list;
  },

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/${id}/acknowledge`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ acknowledgedBy }),
        signal: AbortSignal.timeout(3000)
      });
    } catch {
      // Offline fallback
    }
    farmStore.acknowledgeAlert(id, acknowledgedBy);
  },

  async resolveAlert(id: string, resolvedBy: string, resolutionNote?: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/${id}/resolve`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ resolvedBy, resolutionNote }),
        signal: AbortSignal.timeout(3000)
      });
    } catch {
      // Offline fallback
    }
    farmStore.resolveAlert(id, resolvedBy, resolutionNote);
  },

  async createAlert(data: {
    severity: 'emergency' | 'critical' | 'warning' | 'info';
    metric: string;
    title: string;
    message: string;
    suggestedAction?: string;
    reservoirId?: string;
    batchId?: string;
    zoneId?: string;
    thresholdValue?: number;
    actualValue?: number;
    unit?: string;
  }): Promise<Alert> {
    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // Offline fallback
    }

    return farmStore.addAlert({
      ...data,
      metric: data.metric as any,
      suggestedAction: data.suggestedAction || ''
    });
  }
};
