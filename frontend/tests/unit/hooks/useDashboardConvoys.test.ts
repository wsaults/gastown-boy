import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardConvoys } from '../../../src/hooks/useDashboardConvoys';
import { api } from '../../../src/services/api';
import type { Convoy } from '../../../src/types';

// Mock the API service
vi.mock('../../../src/services/api', () => ({
  api: {
    convoys: {
      list: vi.fn(),
    },
  },
}));

// The hook uses progress field to determine status:
// - Completed: progress.total > 0 && progress.completed === progress.total
// - In Progress: progress.total > 0 && progress.completed < progress.total
// - Unstarted: progress.total === 0
const mockConvoys: Convoy[] = [
  {
    id: 'convoy1',
    name: 'Supply Run Alpha',
    prefix: 'SRA',
    status: 'open',
    progress: { total: 5, completed: 5, pending: 0, in_progress: 0 }, // Completed
    createdAt: '2023-01-01T12:00:00Z',
  },
  {
    id: 'convoy2',
    name: 'Trade Route Beta',
    prefix: 'TRB',
    status: 'open',
    progress: { total: 10, completed: 3, pending: 5, in_progress: 2 }, // In progress
    createdAt: '2023-01-03T12:00:00Z',
  },
  {
    id: 'convoy3',
    name: 'Scavenger Hunt Gamma',
    prefix: 'SHG',
    status: 'open',
    progress: { total: 0, completed: 0, pending: 0, in_progress: 0 }, // Unstarted
    createdAt: '2023-01-02T12:00:00Z',
  },
  {
    id: 'convoy4',
    name: 'Reinforcement Delta',
    prefix: 'RD',
    status: 'open',
    progress: { total: 8, completed: 2, pending: 4, in_progress: 2 }, // In progress
    createdAt: '2023-01-04T12:00:00Z',
  },
];

describe('useDashboardConvoys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and filter convoys successfully', async () => {
    (api.convoys.list as vi.Mock).mockResolvedValue(mockConvoys);

    const { result } = renderHook(() => useDashboardConvoys());

    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.recentConvoys).toEqual([]);
    expect(result.current.error).toBeNull();

    // Wait for the hook to finish fetching
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Should return non-completed convoys sorted: in-progress first, then unstarted
    // convoy2 and convoy4 are in-progress, convoy3 is unstarted
    // convoy1 is completed and should be excluded from recentConvoys
    expect(result.current.recentConvoys).toHaveLength(3);
    expect(result.current.recentConvoys.find((c) => c.id === 'convoy1')).toBeUndefined(); // Completed excluded

    // Counts
    expect(result.current.totalCount).toBe(4);
    expect(result.current.activeCount).toBe(2); // convoy2, convoy4 in progress
    expect(result.current.completedCount).toBe(1); // convoy1

    expect(result.current.error).toBeNull();
    expect(api.convoys.list).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Failed to fetch convoys';
    (api.convoys.list as vi.Mock).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useDashboardConvoys());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.recentConvoys).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it('should return an empty array if no convoys are found', async () => {
    (api.convoys.list as vi.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useDashboardConvoys());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.recentConvoys).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.activeCount).toBe(0);
    expect(result.current.completedCount).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('should sort in-progress convoys before unstarted', async () => {
    const mixedConvoys: Convoy[] = [
      {
        id: 'unstarted1',
        name: 'Unstarted One',
        prefix: 'U1',
        status: 'open',
        progress: { total: 0, completed: 0, pending: 0, in_progress: 0 },
        createdAt: '2023-01-05T12:00:00Z',
      },
      {
        id: 'inprogress1',
        name: 'In Progress One',
        prefix: 'IP1',
        status: 'open',
        progress: { total: 5, completed: 2, pending: 2, in_progress: 1 },
        createdAt: '2023-01-01T12:00:00Z',
      },
    ];
    (api.convoys.list as vi.Mock).mockResolvedValue(mixedConvoys);

    const { result } = renderHook(() => useDashboardConvoys());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // In-progress should come before unstarted
    expect(result.current.recentConvoys[0].id).toBe('inprogress1');
    expect(result.current.recentConvoys[1].id).toBe('unstarted1');
  });
});
