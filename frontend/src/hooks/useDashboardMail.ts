import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Message } from '../types';

interface DashboardMail {
  unreadMessages: Message[];
  recentMessages: Message[];
  totalCount: number;
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch mail data for the dashboard.
 */
export function useDashboardMail(): DashboardMail {
  const [unreadMessages, setUnreadMessages] = useState<Message[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMail = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all messages to get counts
        const allRes = await api.mail.list({ all: true });

        // Group by threadId to get thread count (matches mail tab behavior)
        const threadIds = new Set(allRes.items.map((m) => m.threadId));
        setTotalCount(threadIds.size);

        // Filter unread, sort by most recent, and get top 3
        const unread = allRes.items
          .filter((m) => !m.read)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setUnreadCount(unread.length);
        setUnreadMessages(unread.slice(0, 3));

        // Get 3 most recent messages
        const sorted = [...allRes.items].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setRecentMessages(sorted.slice(0, 3));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch mail');
      } finally {
        setLoading(false);
      }
    };

    void fetchMail();
  }, []);

  return { unreadMessages, recentMessages, totalCount, unreadCount, loading, error };
}
