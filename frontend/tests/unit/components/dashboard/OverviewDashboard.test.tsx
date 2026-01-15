import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardView } from '../../../../src/components/dashboard/OverviewDashboard';
import { useDashboardMail } from '../../../../src/hooks/useDashboardMail';
import { useDashboardConvoys } from '../../../../src/hooks/useDashboardConvoys';
import { useDashboardCrew } from '../../../../src/hooks/useDashboardCrew';

// Mock the custom hooks
vi.mock('../../../../src/hooks/useDashboardMail', () => ({
  useDashboardMail: vi.fn(),
}));
vi.mock('../../../../src/hooks/useDashboardConvoys', () => ({
  useDashboardConvoys: vi.fn(),
}));
vi.mock('../../../../src/hooks/useDashboardCrew', () => ({
  useDashboardCrew: vi.fn(),
}));

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations for the hooks
    (useDashboardMail as ReturnType<typeof vi.fn>).mockReturnValue({
      unreadMessages: [],
      recentMessages: [],
      loading: false,
      error: null,
    });
    (useDashboardConvoys as ReturnType<typeof vi.fn>).mockReturnValue({
      recentConvoys: [],
      loading: false,
      error: null,
    });
    (useDashboardCrew as ReturnType<typeof vi.fn>).mockReturnValue({
      totalCrew: 0,
      activeCrew: 0,
      crewAlerts: [],
      loading: false,
      error: null,
    });
  });

  it('renders main title and widget headers', () => {
    render(<DashboardView />);
    expect(screen.getByText('SYSTEM OVERVIEW')).toBeInTheDocument();
    expect(screen.getByText('MAIL')).toBeInTheDocument();
    expect(screen.getByText('CONVOYS')).toBeInTheDocument();
    expect(screen.getByText('CREW')).toBeInTheDocument();
  });
});