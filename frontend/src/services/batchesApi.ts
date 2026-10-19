import type { CropBatch, GrowthStage, BatchStatus, Cultivar, Reservoir, FarmZone, ZoneLegendCounts } from '../types/farm';
import { farmStore } from '../mock/store';

const API_BASE_URL = 'http://localhost:5000/api/v1/batches';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('hydrosmart_auth_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const batchesApi = {
  /**
   * Lấy danh sách lô trồng (kết nối Backend API, tự động fallback FarmStore nếu offline)
   */
  async getBatches(filters?: { status?: BatchStatus; search?: string }): Promise<CropBatch[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);

      const url = `${API_BASE_URL}?${params.toString()}`;
      const res = await fetch(url, {
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

    // Local fallback
    let list = farmStore.getBatches();
    if (filters?.status) {
      list = list.filter(b => b.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(b => 
        b.batchCode.toLowerCase().includes(q) || 
        b.cultivarName.toLowerCase().includes(q) || 
        b.reservoirName.toLowerCase().includes(q)
      );
    }
    return list;
  },

  /**
   * Lấy chi tiết một lô trồng
   */
  async getBatchById(id: string): Promise<CropBatch | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return json.data;
      }
    } catch {
      // Offline fallback
    }

    const list = farmStore.getBatches();
    return list.find(b => b.id === id) || null;
  },

  /**
   * Tạo lô trồng mới
   */
  async createBatch(newBatch: Omit<CropBatch, 'id' | 'status'>): Promise<CropBatch> {
    let createdBatch: CropBatch | null = null;

    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newBatch),
        signal: AbortSignal.timeout(3000)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          createdBatch = json.data;
        }
      }
    } catch {
      // Offline fallback
    }

    // Đồng bộ vào localStorage store
    const localBatch = farmStore.addBatch(newBatch);
    return createdBatch || localBatch;
  },

  /**
   * Chuyển giai đoạn sinh trưởng của lô
   */
  async advanceStage(batchId: string, newStage: GrowthStage): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/${batchId}/stage`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newStage }),
        signal: AbortSignal.timeout(3000)
      });
    } catch {
      // Offline fallback
    }

    farmStore.advanceBatchStage(batchId, newStage);
  },

  /**
   * Cập nhật trạng thái lô (active, harvested, failed)
   */
  async updateStatus(batchId: string, status: BatchStatus, actualHarvestDate?: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/${batchId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, actualHarvestDate }),
        signal: AbortSignal.timeout(3000)
      });
    } catch {
      // Offline fallback
    }

    farmStore.updateBatchStatus(batchId, status, actualHarvestDate);
  },

  /**
   * Ghi nhận số đo sinh trắc học
   */
  async addObservation(
    batchId: string, 
    obs: { date: string; avgLeafCount: number; avgHeightCm: number; sampleWeightG: number; notes?: string }
  ): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/${batchId}/observations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(obs),
        signal: AbortSignal.timeout(3000)
      });
    } catch {
      // Offline fallback
    }

    farmStore.addBatchObservation(batchId, obs);
  },

  /**
   * Xóa lô trồng
   */
  async deleteBatch(batchId: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/${batchId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(3000)
      });
    } catch {
      // Offline fallback
    }

    farmStore.deleteBatch(batchId);
  },

  /**
   * Lấy danh mục giống cây trồng
   */
  async getCultivars(): Promise<Cultivar[]> {
    try {
      const res = await fetch('http://localhost:5000/api/v1/batches/cultivars', {
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) return json.data;
      }
    } catch {
      // Offline fallback
    }
    return farmStore.getCultivars();
  },

  /**
   * Lấy danh mục bể dinh dưỡng
   */
  async getReservoirs(): Promise<Reservoir[]> {
    try {
      const res = await fetch('http://localhost:5000/api/v1/batches/reservoirs', {
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) return json.data;
      }
    } catch {
      // Offline fallback
    }
    return farmStore.getReservoirs();
  },

  /**
   * Lấy danh sách phân khu thực địa NFT (A1, A2, B2, D1, C1, E1) kèm trạng thái lô
   */
  async getZones(): Promise<{ zones: FarmZone[]; legendCounts: ZoneLegendCounts }> {
    try {
      const res = await fetch('http://localhost:5000/api/v1/batches/zones', {
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(2500)
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

    const zones = farmStore.getZones();
    const legendCounts: ZoneLegendCounts = {
      growing: zones.filter(z => z.status === 'growing').length,
      ready_soon: zones.filter(z => z.status === 'ready_soon').length,
      completed: zones.filter(z => z.status === 'completed').length,
      needs_attention: zones.filter(z => z.status === 'needs_attention').length
    };

    return { zones, legendCounts };
  }
};

