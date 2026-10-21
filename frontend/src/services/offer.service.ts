import api from '@/lib/api';
import type {
  ApiResponse, PaginatedResponse, Offer, PromoCode, OfferRedemption, RedeemResult,
} from '@/lib/types';

export const offerService = {
  // Public catalog (live offers only)
  list: (params?: object) =>
    api.get<PaginatedResponse<Offer>>('/offers', { params }).then((r) => r.data),

  get: (id: number) =>
    api.get<ApiResponse<{ offer: Offer; eligible: boolean; sold_out: boolean; my_redemption: OfferRedemption | null; can_manage: boolean }>>(`/offers/${id}`)
      .then((r) => r.data.data),

  // End-user redemption
  redeem: (id: number) =>
    api.post<ApiResponse<RedeemResult>>(`/offers/${id}/redeem`).then((r) => r.data.data),

  myRedemptions: (params?: object) =>
    api.get<PaginatedResponse<OfferRedemption>>('/offers/redemptions/me', { params }).then((r) => r.data),

  // Org-manager management
  update: (id: number, data: object) =>
    api.put<ApiResponse<{ offer: Offer }>>(`/offers/${id}`, data).then((r) => r.data.data.offer),
  submit: (id: number) =>
    api.post<ApiResponse<{ offer: Offer }>>(`/offers/${id}/submit`).then((r) => r.data.data.offer),
  archive: (id: number) => api.delete(`/offers/${id}`),
  listPromoCodes: (id: number) =>
    api.get<ApiResponse<{ promo_codes: PromoCode[] }>>(`/offers/${id}/promo-codes`).then((r) => r.data.data.promo_codes),
  addPromoCode: (id: number, data: object) =>
    api.post<ApiResponse<{ promo_code: PromoCode }>>(`/offers/${id}/promo-codes`, data).then((r) => r.data.data.promo_code),
};
