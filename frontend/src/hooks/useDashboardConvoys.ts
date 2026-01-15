import { useState, useEffect } from 'react';
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
export function useDashboardConvoys(): DashboardConvoys {
  const [recentConvoys, setRecentConvoys] = useState<Convoy[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConvoys = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.convoys.list();
        setTotalCount(response.length);

        // Count by progress (not status field - backend returns all as "open")
        // Completed = all tracked issues done (progress.completed === progress.total && total > 0)
        // In Progress = has tracked issues but not all done
        // Unstarted = no tracked issues yet (total === 0)
        const completed = response.filter((c) => c.progress.total > 0 && c.progress.completed === c.progress.total).length;
        const active = response.filter((c) => c.progress.total > 0 && c.progress.completed < c.progress.total).length;
        setActiveCount(active);
        setCompletedCount(completed);

        // Only show in-progress or unstarted convoys (exclude completed)
        const notCompleted = response.filter((c) =>
          c.progress.total === 0 || c.progress.completed < c.progress.total
        );
        // Sort: in-progress first, then unstarted
        const sorted = notCompleted.sort((a, b) => {
          const aInProgress = a.progress.total > 0 && a.progress.completed < a.progress.total;
          const bInProgress = b.progress.total > 0 && b.progress.completed < b.progress.total;
          if (aInProgress && !bInProgress) return -1;
          if (!aInProgress && bInProgress) return 1;
          return 0;
        });
        setRecentConvoys(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch convoys');
      } finally {
        setLoading(false);
      }
    };

    void fetchConvoys();
  }, []);

  return { recentConvoys, totalCount, activeCount, completedCount, loading, error };
}
