/**
 * Phạm vi AI hiện tại của dự án:
 *  - Mô hình dự báo năng suất CHỈ được huấn luyện cho Xà lách Batavia.
 *  - Các giống khác (Green Oak, Romaine, Lollo Rossa, Butterhead...) chỉ dùng để
 *    minh hoạ chức năng quản lý. AI cho các giống này sẽ phát triển sau.
 */
export const AI_SUPPORTED_CULTIVAR = 'Batavia Lettuce';

export function isAiSupportedCultivar(name?: string | null): boolean {
  return !!name && /batavia/i.test(name);
}

export function cultivarScopeLabel(name?: string | null): string {
  return isAiSupportedCultivar(name) ? 'AI hỗ trợ' : 'Minh hoạ, AI phát triển sau';
}
