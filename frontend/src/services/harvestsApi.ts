import type { HarvestRecord } from '../types/farm';
import { farmStore } from '../mock/store';
import { API_V1_URL } from '../config/api';

const API_BASE_URL = `${API_V1_URL}/harvests`;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('hydrosmart_token') || localStorage.getItem('hydrosmart_auth_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const harvestsApi = {
  async getHarvests(): Promise<HarvestRecord[]> {
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
    return farmStore.getHarvests();
  },

  async recordHarvest(data: {
    batchId: string;
    batchCode: string;
    cultivarName: string;
    harvestDate: string;
    harvestedPlants: number;
    totalWeightKg: number;
    avgWeightG: number;
    rejectedWeightKg: number;
    aiPredictedWeightG: number;
    grade: 'A' | 'B' | 'C';
    unitPriceVnd?: number;
    totalRevenueVnd?: number;
    operatorName?: string;
    notes?: string;
  }): Promise<HarvestRecord> {
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
          // Sync local mock
          farmStore.recordHarvest(data);
          return json.data;
        }
      }
    } catch {
      // Offline fallback
    }

    return farmStore.recordHarvest(data);
  }
};
