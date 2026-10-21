import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock every data hook the widgets use so we can drive loading/data/empty states.
const mockEvents = vi.fn();
const mockOpps = vi.fn();
const mockChallenges = vi.fn();
const mockLeaderboard = vi.fn();
const mockOffers = vi.fn();

vi.mock('@/hooks/api/useEvents', () => ({ useEvents: () => mockEvents() }));
vi.mock('@/hooks/api/useOpportunities', () => ({ useOpportunities: () => mockOpps() }));
vi.mock('@/hooks/api/useChallenges', () => ({ useChallenges: () => mockChallenges() }));
vi.mock('@/hooks/api/useLeaderboard', () => ({ useLeaderboard: () => mockLeaderboard() }));
vi.mock('@/hooks/api/useOffers', () => ({ useOffers: () => mockOffers() }));

import {
  UpcomingEventsWidget, OpportunitiesWidget, PerksWidget, LeaderboardWidget,
} from './DashboardWidgets';

const infinite = (rows: any[]) => ({ data: { pages: [{ data: rows, pagination: { hasNext: false } }] }, isLoading: false });
const paginated = (rows: any[]) => ({ data: { data: rows, pagination: {} }, isLoading: false });

function wrap(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Dashboard widgets (real API-driven)', () => {
  beforeEach(() => {
    [mockEvents, mockOpps, mockChallenges, mockLeaderboard, mockOffers].forEach((m) => m.mockReset());
  });

  it('UpcomingEventsWidget renders live events', () => {
    mockEvents.mockReturnValue(infinite([{ id: 1, title: 'Design Sprint', start_date: '2026-11-01T10:00:00Z' }]));
    wrap(<UpcomingEventsWidget community="freelancespace" />);
    expect(screen.getByText('Design Sprint')).toBeInTheDocument();
  });

  it('UpcomingEventsWidget shows an empty state when there are none', () => {
    mockEvents.mockReturnValue(infinite([]));
    wrap(<UpcomingEventsWidget community="freelancespace" />);
    expect(screen.getByText(/No upcoming events/i)).toBeInTheDocument();
  });

  it('OpportunitiesWidget renders live opportunities with a custom title', () => {
    mockOpps.mockReturnValue(infinite([{ id: 7, title: 'React Dev', company: 'Acme', type: 'full-time' }]));
    wrap(<OpportunitiesWidget community="hrconnect" title="Open Roles" />);
    expect(screen.getByText('Open Roles')).toBeInTheDocument();
    expect(screen.getByText(/React Dev — Acme/)).toBeInTheDocument();
  });

  it('PerksWidget renders live offers from the catalog', () => {
    mockOffers.mockReturnValue(paginated([{ id: 3, title: '20% off tools', organization: { name: 'ToolCo' } }]));
    wrap(<PerksWidget community="launchpad" />);
    expect(screen.getByText('20% off tools')).toBeInTheDocument();
    expect(screen.getByText('ToolCo')).toBeInTheDocument();
  });

  it('LeaderboardWidget renders ranked entries', () => {
    mockLeaderboard.mockReturnValue(infinite([{ id: 1, first_name: 'Layla', last_name: 'M', period_points: 450 }]));
    wrap(<LeaderboardWidget community="studentzone" />);
    expect(screen.getByText('Layla M')).toBeInTheDocument();
    expect(screen.getByText(/450 pts/)).toBeInTheDocument();
  });
});
