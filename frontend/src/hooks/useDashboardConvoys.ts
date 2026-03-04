import { useMemo } from 'react';
import { usePolling } from './usePolling';
import { api } from '../services/api';
import type { Convoy } from '../types';

interface DashboardConvoys {
  recentConvoys: Convoy[];
  totalCount: number;
  activeCount: number;
  completedCount: number;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch convoy data for the dashboard.
 */
export function useDashboardConvoys(isActive = false): DashboardConvoys {
  const { data, loading, error } = usePolling(
    () => api.convoys.list(),
    { interval: 60000, enabled: isActive }
  );

  const { recentConvoys, totalCount, activeCount, completedCount } = useMemo(() => {
    if (!data) return { recentConvoys: [] as Convoy[], totalCount: 0, activeCount: 0, completedCount: 0 };

    const completed = data.filter((c) => c.progress.total > 0 && c.progress.completed === c.progress.total).length;
    const active = data.filter((c) => c.progress.total > 0 && c.progress.completed < c.progress.total).length;

    const notCompleted = data.filter((c) =>
      c.progress.total === 0 || c.progress.completed < c.progress.total
    );
    const sorted = notCompleted.sort((a, b) => {
      const aInProgress = a.progress.total > 0 && a.progress.completed < a.progress.total;
      const bInProgress = b.progress.total > 0 && b.progress.completed < b.progress.total;
      if (aInProgress && !bInProgress) return -1;
      if (!aInProgress && bInProgress) return 1;
      return 0;
    });

    return {
      recentConvoys: sorted,
      totalCount: data.length,
      activeCount: active,
      completedCount: completed,
    };
  }, [data]);

  return {
    recentConvoys,
    totalCount,
    activeCount,
    completedCount,
    loading,
    error: error?.message ?? null,
  };
}
