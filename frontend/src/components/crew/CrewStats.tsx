import type { CSSProperties } from 'react';
import { useGastownStatus } from '../../hooks/useGastownStatus';
import type { AgentStatus, RigStatus } from '../../types';

/**
 * Props for the CrewStats component.
 */
export interface CrewStatsProps {
  /** Optional CSS class name */
  className?: string;
}

/**
 * Pip-Boy styled crew stats dashboard.
 * Displays agents organized by hierarchy: Town-level → Per-rig sections.
 */
export function CrewStats({ className = '' }: CrewStatsProps) {
  const {
    status,
    loading,
    error,
    refresh,
    lastUpdated,
  } = useGastownStatus();

  const totalAgents = status ? countAllAgents(status.infrastructure, status.rigs) : 0;
  const runningAgents = status ? countRunningAgents(status.infrastructure, status.rigs) : 0;

  return (
    <section style={styles.container} className={className}>
      <header style={styles.header}>
        <h2 style={styles.title}>CREW MANIFEST</h2>
        <div style={styles.syncStatus}>
          <span style={styles.syncIndicator} data-live={!loading && !error}>
            {loading ? '◌' : error ? '✕' : '●'}
          </span>
          {loading ? 'SYNCING...' : error ? 'OFFLINE' : 'LIVE'}
          {lastUpdated && !loading && (
            <span style={styles.syncTime}>
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      {error && (
        <div style={styles.errorBanner} role="alert">
          ⚠ COMM ERROR: {error.message}
        </div>
      )}

      <div style={styles.body}>
        {loading && !status && (
          <div style={styles.loadingState}>
            <div style={styles.loadingPulse} />
            INITIALIZING CREW TELEMETRY...
          </div>
        )}

        {status && (
          <>
            {/* Town-level agents */}
            <TownSection
              mayor={status.infrastructure.mayor}
              deacon={status.infrastructure.deacon}
            />

            {/* Per-rig sections */}
            {status.rigs.map((rig) => (
              <RigSection key={rig.name} rig={rig} />
            ))}

            {status.rigs.length === 0 && (
              <div style={styles.emptyState}>NO RIGS CONFIGURED</div>
            )}
          </>
        )}
      </div>

      <footer style={styles.footer}>
        <button
          type="button"
          style={styles.refreshButton}
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ? '◌ REFRESH' : '↻ REFRESH'}
        </button>
        <div style={styles.stats}>
          <span style={styles.statItem}>
            <span style={styles.statLabel}>AGENTS</span>
            <span style={styles.statValue}>{totalAgents}</span>
          </span>
          <span style={styles.statDivider}>│</span>
          <span style={styles.statItem}>
            <span style={styles.statLabel}>ONLINE</span>
            <span style={{ ...styles.statValue, color: colors.working }}>
              {runningAgents}
            </span>
          </span>
          <span style={styles.statDivider}>│</span>
          <span style={styles.statItem}>
            <span style={styles.statLabel}>OFFLINE</span>
            <span style={{ ...styles.statValue, color: colors.offline }}>
              {totalAgents - runningAgents}
            </span>
          </span>
        </div>
      </footer>
    </section>
  );
}

// =============================================================================
// Town Section - Mayor | Deacon
// =============================================================================

interface TownSectionProps {
  mayor: AgentStatus;
  deacon: AgentStatus;
}

function TownSection({ mayor, deacon }: TownSectionProps) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionIcon}>◈</span>
        <span style={styles.sectionTitle}>TOWN COMMAND</span>
        <span style={styles.sectionLine} />
      </div>
      <div style={styles.townGrid}>
        <AgentCard agent={mayor} type="mayor" icon="👑" />
        <AgentCard agent={deacon} type="deacon" icon="📋" />
      </div>
    </div>
  );
}

// =============================================================================
// Rig Section - Per-rig groupings
// =============================================================================

interface RigSectionProps {
  rig: RigStatus;
}

function RigSection({ rig }: RigSectionProps) {
  const totalInRig = 2 + rig.crew.length + rig.polecats.length; // witness + refinery + crew + polecats
  const runningInRig = [rig.witness, rig.refinery, ...rig.crew, ...rig.polecats]
    .filter(a => a.running).length;

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionIcon}>◇</span>
        <span style={styles.sectionTitle}>RIG: {rig.name.toUpperCase()}</span>
        <span style={styles.rigStats}>
          {runningInRig}/{totalInRig} ACTIVE
        </span>
        <span style={styles.sectionLine} />
      </div>

      {/* Crew Members */}
      {rig.crew.length > 0 && (
        <div style={styles.subsection}>
          <div style={styles.subsectionHeader}>
            <span style={styles.subsectionIcon}>├─</span>
            <span style={styles.subsectionTitle}>CREW</span>
          </div>
          <div style={styles.agentGrid}>
            {rig.crew.map((agent) => (
              <AgentCard key={agent.name} agent={agent} type="crew" icon="👷" />
            ))}
          </div>
        </div>
      )}

      {/* Witness | Refinery */}
      <div style={styles.subsection}>
        <div style={styles.subsectionHeader}>
          <span style={styles.subsectionIcon}>├─</span>
          <span style={styles.subsectionTitle}>INFRASTRUCTURE</span>
        </div>
        <div style={styles.infraGrid}>
          <AgentCard agent={rig.witness} type="witness" icon="👁" />
          <AgentCard agent={rig.refinery} type="refinery" icon="⚙" />
        </div>
      </div>

      {/* Polecats */}
      <div style={styles.subsection}>
        <div style={styles.subsectionHeader}>
          <span style={styles.subsectionIcon}>└─</span>
          <span style={styles.subsectionTitle}>POLECATS</span>
          <span style={styles.polecatCount}>
            {rig.polecats.length > 0 ? `${rig.polecats.filter(p => p.running).length} ACTIVE` : 'NONE'}
          </span>
        </div>
        {rig.polecats.length > 0 ? (
          <div style={styles.polecatGrid}>
            {rig.polecats.map((agent) => (
              <AgentChip key={agent.name} agent={agent} />
            ))}
          </div>
        ) : (
          <div style={styles.polecatEmpty}>NO ACTIVE POLECATS</div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Agent Card - Full card for important agents
// =============================================================================

interface AgentCardProps {
  agent: AgentStatus;
  type: 'mayor' | 'deacon' | 'witness' | 'refinery' | 'crew';
  icon: string;
}

function AgentCard({ agent, type, icon }: AgentCardProps) {
  const statusColor = agent.running ? colors.working : colors.offline;
  const stateColor = getStateColor(agent.state);

  return (
    <div
      style={{
        ...styles.card,
        borderColor: agent.running ? colors.panelBorder : colors.offlineBorder,
      }}
      role="listitem"
      aria-label={`${agent.name} - ${agent.running ? 'running' : 'stopped'}`}
    >
      <div style={styles.cardHeader}>
        <span style={styles.typeIcon}>{icon}</span>
        <span style={styles.agentName}>{agent.name.toUpperCase()}</span>
        <span style={styles.typeBadge}>{type.toUpperCase()}</span>
      </div>

      <div style={styles.cardBody}>
        <div style={styles.statusRow}>
          <span
            style={{
              ...styles.statusIndicator,
              backgroundColor: statusColor,
              boxShadow: agent.running ? `0 0 8px ${statusColor}` : 'none',
            }}
          />
          <span style={{ ...styles.statusText, color: statusColor }}>
            {agent.running ? 'RUNNING' : 'STOPPED'}
          </span>
          {agent.state && agent.state !== 'idle' && (
            <span style={{ ...styles.stateBadge, borderColor: stateColor, color: stateColor }}>
              {agent.state.toUpperCase()}
            </span>
          )}
        </div>

        {agent.unreadMail > 0 && (
          <div style={styles.mailRow}>
            <span style={styles.mailIcon}>✉</span>
            <span style={styles.mailCount}>{agent.unreadMail} UNREAD</span>
            {agent.firstMessageSubject && (
              <span style={styles.mailPreview}>"{agent.firstMessageSubject}"</span>
            )}
          </div>
        )}

        {agent.pinnedWork && agent.pinnedWork.length > 0 && (
          <div style={styles.workRow}>
            <span style={styles.workIcon}>📌</span>
            <span style={styles.workList}>
              {agent.pinnedWork.slice(0, 2).join(', ')}
              {agent.pinnedWork.length > 2 && ` +${agent.pinnedWork.length - 2}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Agent Chip - Compact display for polecats
// =============================================================================

interface AgentChipProps {
  agent: AgentStatus;
}

function AgentChip({ agent }: AgentChipProps) {
  const statusColor = agent.running ? colors.working : colors.offline;

  return (
    <div
      style={{
        ...styles.chip,
        borderColor: agent.running ? colors.primaryDim : colors.offlineBorder,
        opacity: agent.running ? 1 : 0.6,
      }}
      title={`${agent.name} - ${agent.running ? 'running' : 'stopped'}${agent.state ? ` (${agent.state})` : ''}`}
    >
      <span
        style={{
          ...styles.chipIndicator,
          backgroundColor: statusColor,
          boxShadow: agent.running ? `0 0 4px ${statusColor}` : 'none',
        }}
      />
      <span style={styles.chipName}>{agent.name}</span>
      {agent.unreadMail > 0 && (
        <span style={styles.chipMail}>✉{agent.unreadMail}</span>
      )}
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getStateColor(state?: string): string {
  switch (state) {
    case 'working':
      return colors.working;
    case 'stuck':
      return colors.stuck;
    case 'awaiting-gate':
      return colors.blocked;
    default:
      return colors.idle;
  }
}

function countAllAgents(
  _infra: { mayor: AgentStatus; deacon: AgentStatus; daemon: AgentStatus },
  rigs: RigStatus[]
): number {
  let count = 2; // mayor + deacon (daemon is internal, infra agents always counted)
  for (const rig of rigs) {
    count += 2; // witness + refinery
    count += rig.crew.length;
    count += rig.polecats.length;
  }
  return count;
}

function countRunningAgents(
  infra: { mayor: AgentStatus; deacon: AgentStatus; daemon: AgentStatus },
  rigs: RigStatus[]
): number {
  let count = 0;
  if (infra.mayor.running) count++;
  if (infra.deacon.running) count++;
  for (const rig of rigs) {
    if (rig.witness.running) count++;
    if (rig.refinery.running) count++;
    count += rig.crew.filter(a => a.running).length;
    count += rig.polecats.filter(a => a.running).length;
  }
  return count;
}

// =============================================================================
// Styles
// =============================================================================

const colors = {
  primary: '#14F07D',
  primaryBright: '#2BFF96',
  primaryDim: '#0A7A3E',
  primaryGlow: 'rgba(20, 240, 125, 0.35)',
  background: '#0A0A0A',
  backgroundDark: '#050505',
  panelBorder: '#0A7A3E',
  offlineBorder: '#333333',
  // Status colors
  working: '#2BFF96',
  idle: '#7CFFDD',
  blocked: '#FFB000',
  stuck: '#FF4444',
  offline: '#666666',
} as const;

const styles = {
  container: {
    border: `1px solid ${colors.panelBorder}`,
    backgroundColor: colors.background,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    fontFamily: '"Share Tech Mono", "Courier New", monospace',
    color: colors.primary,
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${colors.panelBorder}`,
    paddingBottom: '12px',
  },

  title: {
    margin: 0,
    fontSize: '1.25rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: colors.primary,
    textShadow: `0 0 10px ${colors.primaryGlow}`,
  },

  syncStatus: {
    fontSize: '0.75rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: colors.primaryDim,
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },

  syncIndicator: {
    fontSize: '0.8rem',
  },

  syncTime: {
    color: colors.primary,
    fontSize: '0.7rem',
    opacity: 0.7,
  },

  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minHeight: '300px',
  },

  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    color: colors.primaryDim,
    letterSpacing: '0.1em',
    gap: '16px',
  },

  loadingPulse: {
    width: '40px',
    height: '40px',
    border: `2px solid ${colors.primaryDim}`,
    borderTopColor: colors.primary,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  emptyState: {
    textAlign: 'center',
    padding: '48px',
    color: colors.primaryDim,
    letterSpacing: '0.1em',
  },

  errorBanner: {
    border: `1px solid ${colors.stuck}`,
    color: colors.stuck,
    padding: '8px 12px',
    fontSize: '0.85rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },

  // Section styles
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.85rem',
    letterSpacing: '0.15em',
  },

  sectionIcon: {
    color: colors.primaryBright,
    fontSize: '0.9rem',
  },

  sectionTitle: {
    color: colors.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  sectionLine: {
    flex: 1,
    height: '1px',
    background: `linear-gradient(to right, ${colors.panelBorder}, transparent)`,
  },

  rigStats: {
    fontSize: '0.7rem',
    color: colors.primaryDim,
    letterSpacing: '0.1em',
  },

  // Subsection styles
  subsection: {
    marginLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  subsectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
  },

  subsectionIcon: {
    color: colors.primaryDim,
    fontFamily: 'monospace',
  },

  subsectionTitle: {
    color: colors.primaryDim,
    textTransform: 'uppercase',
  },

  polecatCount: {
    fontSize: '0.65rem',
    color: colors.idle,
    marginLeft: 'auto',
  },

  // Grid layouts
  townGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },

  agentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '10px',
  },

  infraGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },

  polecatGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },

  polecatEmpty: {
    fontSize: '0.7rem',
    color: colors.offline,
    letterSpacing: '0.1em',
    marginLeft: '24px',
    fontStyle: 'italic',
  },

  // Card styles
  card: {
    border: `1px solid ${colors.panelBorder}`,
    backgroundColor: colors.backgroundDark,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'border-color 0.2s ease',
  },

  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  typeIcon: {
    fontSize: '1.1rem',
  },

  agentName: {
    flex: 1,
    fontSize: '0.9rem',
    fontWeight: 'bold',
    letterSpacing: '0.1em',
  },

  typeBadge: {
    fontSize: '0.6rem',
    color: colors.primaryDim,
    border: `1px solid ${colors.primaryDim}`,
    padding: '2px 6px',
    letterSpacing: '0.05em',
  },

  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  statusIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
  },

  statusText: {
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
  },

  stateBadge: {
    fontSize: '0.6rem',
    padding: '1px 5px',
    border: '1px solid',
    marginLeft: 'auto',
    letterSpacing: '0.05em',
  },

  mailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.7rem',
    color: colors.primaryBright,
  },

  mailIcon: {
    fontSize: '0.8rem',
  },

  mailCount: {
    fontWeight: 'bold',
  },

  mailPreview: {
    color: colors.primaryDim,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '120px',
    fontStyle: 'italic',
  },

  workRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.7rem',
    color: colors.idle,
  },

  workIcon: {
    fontSize: '0.7rem',
  },

  workList: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // Chip styles (for polecats)
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    border: `1px solid ${colors.primaryDim}`,
    backgroundColor: colors.backgroundDark,
    fontSize: '0.75rem',
    transition: 'all 0.2s ease',
  },

  chipIndicator: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },

  chipName: {
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },

  chipMail: {
    fontSize: '0.65rem',
    color: colors.primaryBright,
    marginLeft: '4px',
  },

  // Footer
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `1px solid ${colors.panelBorder}`,
    paddingTop: '12px',
  },

  refreshButton: {
    padding: '8px 16px',
    fontSize: '0.8rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    backgroundColor: 'transparent',
    border: `1px solid ${colors.primaryDim}`,
    color: colors.primary,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  },

  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.75rem',
  },

  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },

  statLabel: {
    fontSize: '0.6rem',
    color: colors.primaryDim,
    letterSpacing: '0.1em',
  },

  statValue: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: colors.primary,
  },

  statDivider: {
    color: colors.primaryDim,
    opacity: 0.5,
  },
} satisfies Record<string, CSSProperties>;

export default CrewStats;
