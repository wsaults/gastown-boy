import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { AgentType, CrewMemberStatus } from '../types';

/** Crew member info for dashboard display */
export interface DashboardCrewMember {
  name: string;
  type: AgentType;
  status: CrewMemberStatus;
  currentTask?: string | undefined;
  unreadMail: number;
}

/** Status counts for crew breakdown */
export interface StatusBreakdown {
  idle: number;
  working: number;
  blocked: number;
  stuck: number;
  offline: number;
}

interface DashboardCrew {
  totalCrew: number;
  activeCrew: number;
  statusBreakdown: StatusBreakdown;
  recentlyActive: DashboardCrewMember[];
  idleCrew: DashboardCrewMember[];
  totalUnreadMail: number;
  crewAlerts: string[];
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch crew data for the dashboard.
 */
/** Agent types to show in the dashboard crew section */
const DASHBOARD_AGENT_TYPES: AgentType[] = ['crew', 'polecat'];

/** Status priority for sorting (lower = more important) */
const STATUS_PRIORITY: Record<CrewMemberStatus, number> = {
  working: 0,
  blocked: 1,
  stuck: 2,
  idle: 3,
  offline: 4,
};

export function useDashboardCrew(): DashboardCrew {
  const [totalCrew, setTotalCrew] = useState(0);
  const [activeCrew, setActiveCrew] = useState(0);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown>({
    idle: 0, working: 0, blocked: 0, stuck: 0, offline: 0,
  });
  const [recentlyActive, setRecentlyActive] = useState<DashboardCrewMember[]>([]);
  const [idleCrew, setIdleCrew] = useState<DashboardCrewMember[]>([]);
  const [totalUnreadMail, setTotalUnreadMail] = useState(0);
  const [crewAlerts, setCrewAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCrewData = async () => {
      setLoading(true);
      setError(null);
      try {
        const crewMembers = await api.agents.list();
        setTotalCrew(crewMembers.length);

        // Count by status and total unread mail
        const breakdown: StatusBreakdown = { idle: 0, working: 0, blocked: 0, stuck: 0, offline: 0 };
        let unreadMail = 0;
        for (const m of crewMembers) {
          if (m.status in breakdown) {
            breakdown[m.status]++;
          }
          unreadMail += m.unreadMail;
        }
        setStatusBreakdown(breakdown);
        setActiveCrew(breakdown.working + breakdown.idle);
        setTotalUnreadMail(unreadMail);

        // Filter to crew/polecat types for display
        const dashboardAgents = crewMembers.filter((m) => DASHBOARD_AGENT_TYPES.includes(m.type));

        // Get actively working crew (working, blocked, stuck - not idle/offline)
        const activeAgents = dashboardAgents
          .filter((m) => m.status === 'working' || m.status === 'blocked' || m.status === 'stuck')
          .sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status])
          .slice(0, 3)
          .map((m) => ({ name: m.name, type: m.type, status: m.status, currentTask: m.currentTask, unreadMail: m.unreadMail }));
        setRecentlyActive(activeAgents);

        // Get idle crew (shown when no one is actively working)
        const idle = dashboardAgents
          .filter((m) => m.status === 'idle')
          .slice(0, 3)
          .map((m) => ({ name: m.name, type: m.type, status: m.status, currentTask: m.currentTask, unreadMail: m.unreadMail }));
        setIdleCrew(idle);

        // Generate alerts for blocked/stuck agents
        const alerts: string[] = [];
        for (const m of crewMembers) {
          if (m.status === 'stuck') {
            alerts.push(`${m.name} is STUCK`);
          } else if (m.status === 'blocked') {
            alerts.push(`${m.name} is blocked`);
          }
        }
        setCrewAlerts(alerts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch crew data');
      } finally {
        setLoading(false);
      }
    };

    void fetchCrewData();
  }, []);

  return { totalCrew, activeCrew, statusBreakdown, recentlyActive, idleCrew, totalUnreadMail, crewAlerts, loading, error };
}
