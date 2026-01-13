import type { CSSProperties } from 'react';
import type { CrewMember, AgentType, CrewMemberStatus } from '../../types';

/**
 * Props for the CrewMemberCard component.
 */
export interface CrewMemberCardProps {
  /** The crew member to display */
  member: CrewMember;
  /** Optional CSS class name */
  className?: string;
  /** Optional click handler */
  onClick?: () => void;
}

/** Icon mapping for agent types */
const AGENT_ICONS: Record<AgentType, string> = {
  mayor: '🎩',
  deacon: '🐺',
  witness: '🦉',
  refinery: '🏭',
  crew: '👷',
  polecat: '😺',
};

/** Display labels for agent types */
const AGENT_LABELS: Record<AgentType, string> = {
  mayor: 'MAYOR',
  deacon: 'DEACON',
  witness: 'WITNESS',
  refinery: 'REFINERY',
  crew: 'CREW',
  polecat: 'POLECAT',
};

/** Status display configuration */
const STATUS_CONFIG: Record<CrewMemberStatus, { label: string; color: string }> = {
  idle: { label: 'IDLE', color: '#7CFFDD' },
  working: { label: 'WORKING', color: '#2BFF96' },
  blocked: { label: 'BLOCKED', color: '#FFB000' },
  stuck: { label: 'STUCK', color: '#FF6B35' },
  offline: { label: 'OFFLINE', color: '#FF4444' },
};

/**
 * Card component displaying an individual crew member/agent.
 * Shows type icon, name, status, current task, and unread mail count.
 */
export function CrewMemberCard({ member, className = '', onClick }: CrewMemberCardProps) {
  const statusConfig = STATUS_CONFIG[member.status];
  const isClickable = !!onClick;

  return (
    <article
      style={{
        ...styles.card,
        cursor: isClickable ? 'pointer' : 'default',
      }}
      className={className}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      {/* Header: Icon + Name + Mail Badge */}
      <header style={styles.header}>
        <div style={styles.iconContainer}>
          <span style={styles.icon} role="img" aria-label={member.type}>
            {AGENT_ICONS[member.type]}
          </span>
        </div>
        <div style={styles.nameSection}>
          <h3 style={styles.name}>{member.name}</h3>
          <span style={styles.typeLabel}>{AGENT_LABELS[member.type]}</span>
        </div>
        {member.unreadMail > 0 && (
          <div style={styles.mailBadge} title={`${member.unreadMail} unread`}>
            ✉ {member.unreadMail}
          </div>
        )}
      </header>

      {/* Status Indicator */}
      <div style={styles.statusRow}>
        <div
          style={{
            ...styles.statusDot,
            backgroundColor: statusConfig.color,
            boxShadow: `0 0 8px ${statusConfig.color}60`,
          }}
        />
        <span style={{ ...styles.statusLabel, color: statusConfig.color }}>
          {statusConfig.label}
        </span>
        {member.rig && (
          <span style={styles.rigLabel}>@ {member.rig}</span>
        )}
      </div>

      {/* Current Task (if working) */}
      {member.currentTask && (
        <div style={styles.taskSection}>
          <span style={styles.taskPrefix}>▶</span>
          <span style={styles.taskText}>{member.currentTask}</span>
        </div>
      )}
    </article>
  );
}

// Pip-Boy color palette
const colors = {
  primary: '#14F07D',
  primaryDim: '#0A7A3E',
  primaryGlow: 'rgba(20, 240, 125, 0.35)',
  background: '#0A0A0A',
  backgroundDark: '#050505',
  panelBorder: '#0A7A3E',
  textDim: '#0B8C0D',
} as const;

const styles = {
  card: {
    border: `1px solid ${colors.panelBorder}`,
    backgroundColor: colors.background,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontFamily: '"Share Tech Mono", "Courier New", monospace',
    color: colors.primary,
    transition: 'all 0.15s ease',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  iconContainer: {
    width: '36px',
    height: '36px',
    borderRadius: '4px',
    border: `1px solid ${colors.primaryDim}`,
    backgroundColor: colors.backgroundDark,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: '1.25rem',
  },

  nameSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },

  name: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 400,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: colors.primary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  typeLabel: {
    fontSize: '0.65rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: colors.textDim,
  },

  mailBadge: {
    fontSize: '0.75rem',
    padding: '2px 6px',
    borderRadius: '4px',
    border: `1px solid ${colors.primaryDim}`,
    backgroundColor: colors.backgroundDark,
    color: colors.primary,
    letterSpacing: '0.05em',
  },

  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },

  statusLabel: {
    fontSize: '0.8rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  },

  rigLabel: {
    fontSize: '0.7rem',
    letterSpacing: '0.1em',
    color: colors.textDim,
    marginLeft: 'auto',
  },

  taskSection: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
    padding: '6px 8px',
    backgroundColor: colors.backgroundDark,
    borderLeft: `2px solid ${colors.primaryDim}`,
  },

  taskPrefix: {
    fontSize: '0.7rem',
    color: colors.primaryDim,
  },

  taskText: {
    fontSize: '0.75rem',
    color: colors.primary,
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
} satisfies Record<string, CSSProperties>;

export default CrewMemberCard;
