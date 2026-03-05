import { useMemo } from 'react';
import { usePolling } from './usePolling';
import { api } from '../services/api';
import type { AgentType, CrewMemberStatus } from '../types';

/** Crew member info for dashboard display */
export interface DashboardCrewMember {
  name: string;
  type: AgentType;
  status: CrewMemberStatus;
  rig: string | null;
  currentTask?: string | undefined;
}

interface DashboardCrew {
  totalCrew: number;
  activeCrew: number;
  recentCrew: DashboardCrewMember[];
  crewAlerts: string[];
  loading: boolean;
  error: string | null;
}

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

/**
 * Custom hook to fetch crew data for the dashboard.
 */
export function useDashboardCrew(isActive = false): DashboardCrew {
  const { data, loading, error } = usePolling(
    () => api.agents.list(),
    { interval: 60000, enabled: isActive }
  );

  const { totalCrew, activeCrew, recentCrew, crewAlerts } = useMemo(() => {
    if (!data) return { totalCrew: 0, activeCrew: 0, recentCrew: [] as DashboardCrewMember[], crewAlerts: [] as string[] };

    const dashboardAgents = data.filter((m) =>
      DASHBOARD_AGENT_TYPES.includes(m.type) &&
      !(m.type === 'polecat' && m.status === 'offline')
    );

    const active = dashboardAgents.filter((m) => m.status === 'working' || m.status === 'idle').length;

    const recent = dashboardAgents
      .sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status])
      .slice(0, 3)
      .map((m) => ({ name: m.name, type: m.type, status: m.status, rig: m.rig, currentTask: m.currentTask }));

    const alerts: string[] = [];
    for (const m of dashboardAgents) {
      // Problem-based alerts take priority
      if (m.problems && m.problems.length > 0) {
        for (const p of m.problems) {
          if (p.type === 'gupp_violation') {
            alerts.push(`${m.name}: GUPP VIOLATION (${p.minutesIdle}m idle)`);
          } else if (p.type === 'zombie') {
            alerts.push(`${m.name}: ZOMBIE (dead with hooked work)`);
          } else if (p.type === 'stalled') {
            alerts.push(`${m.name}: STALLED (${p.minutesIdle}m idle)`);
          }
        }
      } else if (m.status === 'stuck') {
        alerts.push(`${m.name} is STUCK`);
      } else if (m.status === 'blocked') {
        alerts.push(`${m.name} is blocked`);
      }
    }

    return {
      totalCrew: dashboardAgents.length,
      activeCrew: active,
      recentCrew: recent,
      crewAlerts: alerts,
    };
  }, [data]);

  return {
    totalCrew,
    activeCrew,
    recentCrew,
    crewAlerts,
    loading,
    error: error?.message ?? null,
  };
}
