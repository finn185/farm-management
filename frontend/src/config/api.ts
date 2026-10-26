/**
 * Cấu hình URL kết nối Backend API & AI Microservice
 * - Trên Railway: truyền biến môi trường VITE_API_URL (hoặc tự động nhận diện domain Railway)
 * - Dưới máy local: tự động mặc định http://localhost:5000
 */
function getDefaultBackendUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('.up.railway.app')) {
    return 'https://farm-management-production-1c61.up.railway.app';
  }
  return 'http://localhost:5000';
}

function normalizeBaseUrl(raw: string | undefined, fallback: string): string {
  const trimmed = raw?.trim();
  if (!trimmed) return fallback;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1')
      ? `http://${trimmed}`
      : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, '').replace(/\/api(\/v1)?$/i, '');
}

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

export const API_ROOT_URL = normalizeBaseUrl(env.VITE_API_URL, getDefaultBackendUrl());
export const API_V1_URL = `${API_ROOT_URL}/api/v1`;

export const AI_ROOT_URL = normalizeBaseUrl(env.VITE_AI_URL, 'http://localhost:8000');
