import type { FarmZone } from '../types/farm';
import { farmStore } from '../mock/store';

const API_BASE_URL = 'http://localhost:5000/api/v1/zones';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('hydrosmart_token') || localStorage.getItem('hydrosmart_auth_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function normalizeZone(z: any): FarmZone {
  const activeBatch = Array.isArray(z.batches) && z.batches.length > 0 ? z.batches[0] : null;
  let progress = z.biomassProgress;
  if (progress === undefined && activeBatch) {
    try {
      const start = new Date(activeBatch.seedDate).getTime();
      const end = new Date(activeBatch.expectedHarvestDate).getTime();
      const now = Date.now();
      if (end > start && now >= start) {
        const p = Math.round(((now - start) / (end - start)) * 100);
        if (p >= 5 && p <= 99) progress = p;
      }
    } catch {
      // ignore
    }
    if (progress === undefined) {
      if (activeBatch.currentStage === 'harvest') progress = 95;
      else if (activeBatch.currentStage === 'pre_harvest') progress = 80;
      else if (activeBatch.currentStage === 'vegetative') progress = 55;
      else if (activeBatch.currentStage === 'seedling') progress = 25;
      else progress = 50;
    }
  }

  return {
    ...z,
    currentBatchId: z.currentBatchId ?? activeBatch?.id,
    currentBatchCode: z.currentBatchCode ?? activeBatch?.batchCode,
    cultivarName: z.cultivarName ?? activeBatch?.cultivar?.name,
    cropName: z.cropName ?? activeBatch?.cultivar?.cropName,
    plantQuantity: z.plantQuantity ?? activeBatch?.plantQuantity,
    currentQuantity: z.currentQuantity ?? activeBatch?.currentQuantity,
    currentStage: z.currentStage ?? activeBatch?.currentStage,
    expectedHarvestDate: z.expectedHarvestDate ?? activeBatch?.expectedHarvestDate,
    seedDate: z.seedDate ?? activeBatch?.seedDate,
    biomassProgress: progress,
    reservoirId: z.reservoirId ?? activeBatch?.reservoirId ?? z.reservoir?.id,
    reservoirName: z.reservoirName ?? z.reservoir?.name,
    ph: z.ph ?? z.reservoir?.currentPh,
    ec: z.ec ?? z.reservoir?.currentEc,
    waterTemp: z.waterTemp ?? z.reservoir?.currentWaterTemp
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
          return json.data.map(normalizeZone);
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
