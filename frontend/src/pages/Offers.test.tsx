import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { Offer } from '@/lib/types';

// ─── Mock the data hooks so the page renders deterministically ──────────────────
const mockUseOffers = vi.fn();
vi.mock('@/hooks/api/useOffers', () => ({
  useOffers: (...args: any[]) => mockUseOffers(...args),
  useOffer: () => ({ data: undefined, isLoading: true }),
  useRedeemOfferMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

// Avoid socket side effects from AuthProvider's auth.service import chain.
vi.mock('@/lib/socket', () => ({ connectSockets: vi.fn(), disconnectSockets: vi.fn() }));

// Navbar is not under test and pulls in the i18n/router context chain; stub it.
vi.mock('@/components/Navbar', () => ({ default: () => null }));

// Stub auth so the page renders without the AuthProvider/localStorage chain.
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ isLoggedIn: false }) }));

import Offers, { discountLabel } from './Offers';

function makeOffer(over: Partial<Offer> = {}): Offer {
  return {
    id: 1, organization_id: 1, title: 'Half off Pro', description: 'A great perk',
    category: 'discount', discount_type: 'percentage', discount_value: 50, currency: 'USD',
    redemption_type: 'code', redemption_url: null, redemption_instructions: null,
    eligible_personas: [], target_communities: [], status: 'approved', rejection_reason: null,
    total_limit: null, per_user_limit: 1, redemptions_count: 0, starts_at: null, expires_at: null,
    is_featured: false, created_at: new Date().toISOString(),
    organization: { id: 1, slug: 'acme', name: 'Acme', logo_url: null, is_verified: true },
    ...over,
  };
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Offers />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('discountLabel', () => {
  it('formats a percentage discount', () => {
    expect(discountLabel(makeOffer({ discount_type: 'percentage', discount_value: 25 }))).toBe('25% off');
  });
  it('formats a fixed discount with currency', () => {
    expect(discountLabel(makeOffer({ discount_type: 'fixed', discount_value: 10, currency: 'USD' }))).toBe('USD 10 off');
  });
  it('labels a BOGO deal', () => {
    expect(discountLabel(makeOffer({ discount_type: 'bogo', discount_value: null }))).toBe('Buy one get one');
  });
  it('returns null when there is no discount', () => {
    expect(discountLabel(makeOffer({ discount_type: 'none', discount_value: null }))).toBeNull();
  });
});

describe('Offers page', () => {
  beforeEach(() => mockUseOffers.mockReset());

  it('shows a loading spinner while fetching', () => {
    mockUseOffers.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderPage();
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders offers from the catalog', () => {
    mockUseOffers.mockReturnValue({
      data: { data: [makeOffer({ title: 'Half off Pro' }), makeOffer({ id: 2, title: 'Free course' })], pagination: {} },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByText('Half off Pro')).toBeInTheDocument();
    expect(screen.getByText('Free course')).toBeInTheDocument();
    // discount label from the percentage offer
    expect(screen.getAllByText('50% off').length).toBeGreaterThan(0);
  });

  it('shows an empty state when there are no offers', () => {
    mockUseOffers.mockReturnValue({ data: { data: [], pagination: {} }, isLoading: false });
    renderPage();
    expect(screen.getByText(/No perks available/i)).toBeInTheDocument();
  });

  it('marks ineligible offers as requiring eligibility', () => {
    mockUseOffers.mockReturnValue({
      data: { data: [makeOffer({ eligible: false, eligible_personas: ['freelancer'] })], pagination: {} },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByText(/Eligibility required/i)).toBeInTheDocument();
  });
});
