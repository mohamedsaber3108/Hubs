import adminApi from '../adminApi';

export const adminOffersService = {
  // Offers moderation
  listOffers:    (params?: object) => adminApi.get('/offers', { params }).then((r) => r.data),
  reviewOffer:   (id: number, decision: 'approved' | 'rejected', reason?: string) =>
    adminApi.patch(`/offers/${id}/review`, { decision, reason }).then((r) => r.data),
  listRedemptions: (id: number, params?: object) =>
    adminApi.get(`/offers/${id}/redemptions`, { params }).then((r) => r.data),

  // Organization verification
  listOrganizations: (params?: object) => adminApi.get('/organizations', { params }).then((r) => r.data),
  setVerification:   (id: number, verified: boolean) =>
    adminApi.patch(`/organizations/${id}/verify`, { verified }).then((r) => r.data),
};
