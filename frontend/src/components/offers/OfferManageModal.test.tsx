import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Offer } from '@/lib/types';

// Mock the data hooks the modal uses.
const update = vi.fn();
vi.mock('@/hooks/api/useOffers', () => ({
  useUpdateOfferMutation: () => ({ mutate: update, isPending: false }),
  usePromoCodes: () => ({ data: [], isLoading: false }),
  useAddPromoCodeMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdatePromoCodeMutation: () => ({ mutate: vi.fn() }),
  useOfferAnalytics: () => ({
    data: { analytics: { total_redemptions: 3, remaining: 7, promo_codes_count: 1, promo_code_uses: 3, by_status: { redeemed: 3 }, status: 'approved', total_limit: 10, per_user_limit: 1, promo_code_capacity: 10 }, recent: [] },
    isLoading: false,
  }),
}));
vi.mock('@/hooks/api/useCommunities', () => ({
  useCommunities: () => ({ data: [{ id: 1, slug: 'freelancespace', name: 'FreelanceSpace', emoji: '🔥' }] }),
}));

import OfferManageModal from './OfferManageModal';

function makeOffer(over: Partial<Offer> = {}): Offer {
  return {
    id: 1, organization_id: 1, title: 'Half off Pro', description: 'A great perk',
    category: 'discount', discount_type: 'percentage', discount_value: 50, currency: 'USD',
    redemption_type: 'code', redemption_url: null, redemption_instructions: null,
    eligible_personas: [], target_communities: [], status: 'approved', rejection_reason: null,
    total_limit: 10, per_user_limit: 1, redemptions_count: 3, starts_at: null, expires_at: null,
    is_featured: false, created_at: new Date().toISOString(), ...over,
  };
}

function wrap(offer: Offer) {
  return render(<MemoryRouter><OfferManageModal slug="acme" offer={offer} onClose={() => {}} /></MemoryRouter>);
}

describe('OfferManageModal', () => {
  beforeEach(() => update.mockReset());

  it('renders the edit form pre-filled from the offer', () => {
    wrap(makeOffer());
    expect(screen.getByDisplayValue('Half off Pro')).toBeInTheDocument();
    expect(screen.getByText(/return this offer to/i)).toBeInTheDocument(); // approved -> warns re-approval
  });

  it('saves rich edits via the update mutation', () => {
    wrap(makeOffer());
    fireEvent.click(screen.getByText('Save changes'));
    expect(update).toHaveBeenCalledTimes(1);
    const arg = update.mock.calls[0][0];
    expect(arg.id).toBe(1);
    expect(arg.data.title).toBe('Half off Pro');
    expect(arg.data.per_user_limit).toBe(1);
  });

  it('toggles a persona eligibility chip into the payload', () => {
    wrap(makeOffer());
    fireEvent.click(screen.getByText('freelancer'));
    fireEvent.click(screen.getByText('Save changes'));
    expect(update.mock.calls[0][0].data.eligible_personas).toContain('freelancer');
  });

  it('switches to the Analytics tab and shows redemption totals', () => {
    wrap(makeOffer());
    fireEvent.click(screen.getByText('Analytics'));
    expect(screen.getByText('Redemptions')).toBeInTheDocument();
    expect(screen.getByText('Code uses')).toBeInTheDocument();
    // total_redemptions (3) renders as a stat value; may also appear elsewhere.
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });
});
