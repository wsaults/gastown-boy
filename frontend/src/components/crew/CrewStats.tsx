import type { CSSProperties } from 'react';
import { api } from '../../services/api';
import { usePolling } from '../../hooks/usePolling';
import { CrewMemberCard } from './CrewMemberCard';
import type { CrewMember } from '../../types';

/**
 * Props for the CrewStats component.
 */
export interface CrewStatsProps {
  /** Optional CSS class name */
  className?: string;
  /** Polling interval in ms (default: 5000) */
  pollInterval?: number;
}

/**
 * CrewStats dashboard displaying all agents with their status.
 * Handles loading, offline, and empty states gracefully.
 */
export function CrewStats({ className = '', pollInterval = 5000 }: CrewStatsProps) {
  const {
    data: agents,
    loading,
    error,
    refresh,
    lastUpdated,
  } = usePolling<CrewMember[]>(() => api.agents.list(), {
    interval: pollInterval,
  });

  const isOffline = !!error;
  const isEmpty = !loading && !error && agents?.length === 0;
  const hasAgents = agents && agents.length > 0;

  return (
    <section style={styles.container} className={className}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.title}>CREW STATS</h2>
          {hasAgents && (
            <span style={styles.countBadge}>{agents.length} AGENTS</span>
          )}
        </div>
        <div style={styles.headerRight}>
          <div style={styles.syncStatus}>
            {loading ? (
              <span style={styles.syncingText}>SYNCING...</span>
            ) : isOffline ? (
              <span style={styles.offlineText}>OFFLINE</span>
            ) : (
              <span style={styles.liveText}>LIVE</span>
            )}
            {lastUpdated && !loading && (
              <span style={styles.syncTime}>
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          <button
            type="button"
            style={styles.refreshButton}
            onClick={() => void refresh()}
            disabled={loading}
            aria-label="Refresh crew stats"
          >
            {loading ? '...' : '↻'}
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {isOffline && (
        <div style={styles.errorBanner} role="alert">
          <span style={styles.errorIcon}>⚠</span>
          <span style={styles.errorText}>
            CONNECTION LOST: {error?.message ?? 'Unable to reach backend'}
          </span>
          <button
            type="button"
            style={styles.retryButton}
            onClick={() => void refresh()}
          >
            RETRY
          </button>
        </div>
      )}

      {/* Content Area */}
      <div style={styles.content}>
        {/* Loading State */}
        {loading && !hasAgents && (
          <div style={styles.stateContainer}>
            <div style={styles.stateIcon}>◐</div>
            <div style={styles.stateTitle}>SCANNING CREW...</div>
            <div style={styles.stateMessage}>
              Establishing connection to Gastown network
            </div>
          </div>
        )}

        {/* Offline State (when no cached data) */}
        {isOffline && !hasAgents && (
          <div style={styles.stateContainer}>
            <div style={{ ...styles.stateIcon, ...styles.offlineIcon }}>⚡</div>
            <div style={{ ...styles.stateTitle, ...styles.offlineTitle }}>
              NETWORK OFFLINE
            </div>
            <div style={styles.stateMessage}>
              Unable to connect to Gastown backend.
              <br />
              Check your connection and try again.
            </div>
            <button
              type="button"
              style={styles.stateButton}
              onClick={() => void refresh()}
            >
              RECONNECT
            </button>
          </div>
        )}

        {/* Empty State */}
        {isEmpty && (
          <div style={styles.stateContainer}>
            <div style={styles.stateIcon}>👤</div>
            <div style={styles.stateTitle}>NO CREW FOUND</div>
            <div style={styles.stateMessage}>
              Gastown is running but no agents are registered.
              <br />
              Start a rig to see crew members here.
            </div>
          </div>
        )}

        {/* Agent Grid */}
        {hasAgents && (
          <div style={styles.grid}>
            {agents.map((agent) => (
              <CrewMemberCard key={agent.id} member={agent} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Pip-Boy color palette
const colors = {
  primary: '#14F07D',
  primaryDim: '#0A7A3E',
  primaryGlow: '#14F07D40',
  background: '#0A0A0A',
  backgroundDark: '#050505',
  error: '#FF6B35',
  errorGlow: '#FF6B3540',
  offline: '#FF4444',
  textDim: '#0B8C0D',
} as const;

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    fontFamily: '"Share Tech Mono", "Courier New", monospace',
    color: colors.primary,
    backgroundColor: colors.background,
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: `1px solid ${colors.primaryDim}`,
    backgroundColor: colors.backgroundDark,
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  title: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 'normal',
    letterSpacing: '0.15em',
    textShadow: `0 0 8px ${colors.primaryGlow}`,
  },

  countBadge: {
    padding: '2px 8px',
    fontSize: '0.75rem',
    border: `1px solid ${colors.primaryDim}`,
    borderRadius: '2px',
    backgroundColor: colors.backgroundDark,
    letterSpacing: '0.05em',
    color: colors.primaryDim,
  },

  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  syncStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
  },

  syncingText: {
    color: colors.primary,
  },

  liveText: {
    color: colors.primary,
  },

  offlineText: {
    color: colors.error,
  },

  syncTime: {
    color: colors.textDim,
    fontSize: '0.7rem',
  },

  refreshButton: {
    width: '28px',
    height: '28px',
    padding: 0,
    border: `1px solid ${colors.primaryDim}`,
    borderRadius: '2px',
    background: 'transparent',
    color: colors.primary,
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'border-color 0.1s',
  },

  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    backgroundColor: colors.errorGlow,
    borderBottom: `1px solid ${colors.error}`,
  },

  errorIcon: {
    fontSize: '1rem',
    color: colors.error,
  },

  errorText: {
    flex: 1,
    fontSize: '0.85rem',
    color: colors.error,
    letterSpacing: '0.05em',
  },

  retryButton: {
    padding: '4px 10px',
    border: `1px solid ${colors.error}`,
    borderRadius: '2px',
    background: 'transparent',
    color: colors.error,
    fontFamily: 'inherit',
    fontSize: '0.75rem',
    cursor: 'pointer',
    letterSpacing: '0.05em',
  },

  content: {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
  },

  stateContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    textAlign: 'center',
    gap: '12px',
  },

  stateIcon: {
    fontSize: '3rem',
    opacity: 0.6,
  },

  offlineIcon: {
    color: colors.error,
    opacity: 1,
  },

  stateTitle: {
    fontSize: '1.25rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: colors.primary,
  },

  offlineTitle: {
    color: colors.error,
  },

  stateMessage: {
    fontSize: '0.85rem',
    color: colors.textDim,
    lineHeight: 1.6,
    maxWidth: '320px',
  },

  stateButton: {
    marginTop: '8px',
    padding: '8px 20px',
    border: `1px solid ${colors.primary}`,
    borderRadius: '2px',
    background: 'transparent',
    color: colors.primary,
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    cursor: 'pointer',
    letterSpacing: '0.1em',
    transition: 'background-color 0.1s, box-shadow 0.1s',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px',
  },
} satisfies Record<string, CSSProperties>;

export default CrewStats;
