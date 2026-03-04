import { useMemo } from 'react';
import { usePolling } from './usePolling';
import { api } from '../services/api';
import type { Message } from '../types';

interface DashboardMail {
  recentMessages: Message[];
  totalCount: number;
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch mail data for the dashboard.
 */
export function useDashboardMail(isActive = false): DashboardMail {
  const { data, loading, error } = usePolling(
    () => api.mail.list({ all: true }),
    { interval: 60000, enabled: isActive }
  );

  const { recentMessages, totalCount, unreadCount } = useMemo(() => {
    if (!data?.items) return { recentMessages: [] as Message[], totalCount: 0, unreadCount: 0 };

    const threadIds = new Set(data.items.map((m) => m.threadId));
    const unread = data.items.filter((m) => !m.read).length;

    const filtered = data.items.filter((m) => !m.subject.toUpperCase().includes('HANDOFF'));
    const sorted = filtered.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return {
      recentMessages: sorted.slice(0, 5),
      totalCount: threadIds.size,
      unreadCount: unread,
    };
  }, [data]);

  return {
    recentMessages,
    totalCount,
    unreadCount,
    loading,
    error: error?.message ?? null,
  };
}
