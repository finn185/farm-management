import type { FarmZone } from '../types/farm';
import { farmStore } from '../mock/store';

const API_BASE_URL = 'http://localhost:5000/api/v1/zones';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('hydrosmart_auth_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const zonesApi = {
  async getZones(): Promise<FarmZone[]> {
    try {
      const res = await fetch(API_BASE_URL, {
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {
      // Offline fallback
    }
    return farmStore.getZones();
  },

  async getZoneById(id: string): Promise<FarmZone | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        headers: getAuthHeaders(),
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
    return farmStore.getZoneById(id) || null;
  },

  async updateZone(id: string, updates: Partial<FarmZone>): Promise<FarmZone[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        farmStore.updateZone(id, updates);
        return farmStore.getZones();
      }
    } catch {
      // Offline fallback
    }
    return farmStore.updateZone(id, updates);
  }
};
