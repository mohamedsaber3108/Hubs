import api from '@/lib/api';
import type { ApiResponse, PaginatedResponse, Organization, Offer, PartnershipRequest } from '@/lib/types';

export const organizationService = {
  list: (params?: object) =>
    api.get<PaginatedResponse<Organization>>('/organizations', { params }).then((r) => r.data),

  get: (slug: string) =>
    api.get<ApiResponse<{ organization: Organization; my_role: string | null }>>(`/organizations/${slug}`).then((r) => r.data.data),

  create: (data: object) =>
    api.post<ApiResponse<{ organization: Organization }>>('/organizations', data).then((r) => r.data.data.organization),

  update: (slug: string, data: object) =>
    api.put<ApiResponse<{ organization: Organization }>>(`/organizations/${slug}`, data).then((r) => r.data.data.organization),

  // Manager views of the org's own offers (any status) + create.
  listOffers: (slug: string) =>
    api.get<ApiResponse<{ offers: Offer[] }>>(`/organizations/${slug}/offers`).then((r) => r.data.data.offers),

  createOffer: (slug: string, data: object) =>
    api.post<ApiResponse<{ offer: Offer }>>(`/organizations/${slug}/offers`, data).then((r) => r.data.data.offer),

  // Partnerships
  listPartnerships: (slug: string) =>
    api.get<ApiResponse<{ partnerships: PartnershipRequest[] }>>(`/organizations/${slug}/partnerships`).then((r) => r.data.data.partnerships),

  requestPartnership: (slug: string, data: { target_slug: string; message?: string }) =>
    api.post<ApiResponse<{ partnership: PartnershipRequest }>>(`/organizations/${slug}/partnerships`, data).then((r) => r.data.data.partnership),

  respondPartnership: (slug: string, id: number, action: 'accept' | 'decline' | 'end') =>
    api.patch<ApiResponse<{ partnership: PartnershipRequest }>>(`/organizations/${slug}/partnerships/${id}`, { action }).then((r) => r.data.data.partnership),
};
