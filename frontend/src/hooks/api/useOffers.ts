import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offerService } from '@/services/offer.service';
import { organizationService } from '@/services/organization.service';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

// ─── Catalog ──────────────────────────────────────────────────────────────────
export function useOffers(params?: object) {
  return useQuery({ queryKey: queryKeys.offers(params), queryFn: () => offerService.list(params), staleTime: 60_000 });
}

export function useOffer(id: number) {
  return useQuery({ queryKey: queryKeys.offer(id), queryFn: () => offerService.get(id), enabled: !!id });
}

export function useMyRedemptions() {
  return useQuery({ queryKey: queryKeys.myRedemptions(), queryFn: () => offerService.myRedemptions() });
}

export function useRedeemOfferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => offerService.redeem(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.offer(id) });
      qc.invalidateQueries({ queryKey: queryKeys.myRedemptions() });
      toast.success('Offer redeemed!');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Could not redeem offer');
    },
  });
}

// ─── Organizations ──────────────────────────────────────────────────────────
export function useOrganizations(params?: object) {
  return useQuery({ queryKey: queryKeys.organizations(params), queryFn: () => organizationService.list(params) });
}

export function useOrganization(slug: string) {
  return useQuery({ queryKey: queryKeys.organization(slug), queryFn: () => organizationService.get(slug), enabled: !!slug });
}

export function useOrganizationOffers(slug: string) {
  return useQuery({ queryKey: queryKeys.organizationOffers(slug), queryFn: () => organizationService.listOffers(slug), enabled: !!slug });
}

export function useCreateOrganizationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => organizationService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization created');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not create organization'),
  });
}

export function useCreateOfferMutation(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => organizationService.createOffer(slug, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.organizationOffers(slug) });
      toast.success('Offer created as draft');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not create offer'),
  });
}

export function useSubmitOfferMutation(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => offerService.submit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.organizationOffers(slug) });
      toast.success('Submitted for review');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not submit offer'),
  });
}

export function useAddPromoCodeMutation(offerId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => offerService.addPromoCode(offerId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.offerPromoCodes(offerId) });
      toast.success('Promo code added');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not add promo code'),
  });
}
