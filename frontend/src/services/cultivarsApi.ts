import type { Cultivar } from '../types/farm';
import { farmStore } from '../mock/store';

const API_BASE_URL = 'http://localhost:5000/api/v1/cultivars';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('hydrosmart_auth_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const cultivarsApi = {
  async getCultivars(): Promise<Cultivar[]> {
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
    return farmStore.getCultivars();
  },

  async getCultivarById(id: string): Promise<Cultivar | null> {
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
    const list = farmStore.getCultivars();
    return list.find(c => c.id === id) || null;
  }
};
