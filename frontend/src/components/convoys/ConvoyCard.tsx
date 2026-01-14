import { useState, useMemo, type CSSProperties } from 'react';
import type { Convoy, TrackedIssue } from '../../types';

interface ConvoyCardProps {
  convoy: Convoy;
}

export function ConvoyCard({ convoy }: ConvoyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { completed, total } = convoy.progress;
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const isSingle = total === 1;
  const isDone = completed === total && total > 0;

  // Compute aggregated info
  const info = useMemo(() => {
    const workers = new Set<string>();
    let lastActive: Date | null = null;
    let maxPriority = 4;

    convoy.trackedIssues.forEach(issue => {
      if (issue.assignee) {
        // Extract short name: "rig/polecats/nux" -> "nux"
        const parts = issue.assignee.split('/');
        workers.add(parts[parts.length - 1]);
      }
      if (issue.updatedAt) {
        const d = new Date(issue.updatedAt);
        if (!lastActive || d > lastActive) lastActive = d;
      }
      if (issue.priority !== undefined && issue.priority < maxPriority) {
        maxPriority = issue.priority;
      }
    });

    return {
      workers: Array.from(workers),
      lastActive,
      priority: maxPriority
    };
  }, [convoy.trackedIssues]);

  const formatRelativeTime = (date: Date | null) => {
    if (!date) return 'UNKNOWN';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'JUST NOW';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}M AGO`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}H AGO`;
    return date.toLocaleDateString();
  };

  return (
    <div 
      style={{
        ...styles.container,
        borderColor: isExpanded ? colors.primary : colors.panelBorder
      }}
    >
      <div 
        style={styles.mainRow} 
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        aria-expanded={isExpanded}
      >
        {/* Left: ID & Priority */}
        <div style={styles.leftSection}>
          <span style={{ 
            ...styles.statusIcon, 
            color: isDone ? colors.working : colors.primary 
          }}>
            {isDone ? '●' : '○'}
          </span>
          <div style={styles.idGroup}>
            <span style={styles.id}>{convoy.id}</span>
            <span style={{
              ...styles.priority,
              color: info.priority <= 1 ? colors.stuck : colors.primaryDim
            }}>
              P{info.priority}
            </span>
          </div>
        </div>

        {/* Middle: Title & Workers */}
        <div style={styles.middleSection}>
          <div style={styles.titleRow}>
            <span style={styles.title}>{convoy.title}</span>
            <span style={styles.statusBadge}>{convoy.status.toUpperCase()}</span>
          </div>
          <div style={styles.metadataRow}>
            <span style={styles.activityTime}>{formatRelativeTime(info.lastActive)}</span>
            <span style={styles.metaDivider}>|</span>
            <div style={styles.workerList}>
              {info.workers.length > 0 ? (
                info.workers.map(w => <span key={w} style={styles.workerChip}>@{w}</span>)
              ) : (
                <span style={styles.unassigned}>UNASSIGNED</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Progress */}
        <div style={styles.rightSection}>
          {!isSingle ? (
            <div style={styles.progressContainer}>
              <div style={styles.progressLabel}>
                {completed}/{total}
              </div>
              <div style={styles.progressBarBg}>
                <div 
                  style={{ 
                    ...styles.progressBarFill, 
                    width: `${percentage}%`,
                    backgroundColor: isDone ? colors.working : colors.primary
                  }} 
                />
              </div>
            </div>
          ) : (
            <div style={{ 
              ...styles.singleProgress,
              color: isDone ? colors.working : colors.primaryDim
            }}>
              {isDone ? 'LANDED' : 'IN FLIGHT'}
            </div>
          )}
          <span style={{
            ...styles.expandIcon,
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
          }}>▶</span>
        </div>
      </div>

      {/* Expanded View: Issue List */}
      {isExpanded && (
        <div style={styles.detailsArea}>
          <div style={styles.detailsHeader}>TRACKED ISSUES</div>
          <div style={styles.issueList}>
            {convoy.trackedIssues.map(issue => (
              <TrackedIssueRow key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TrackedIssueRow({ issue }: { issue: TrackedIssue }) {
  const isClosed = issue.status === 'closed';
  return (
    <div style={styles.issueRow}>
      <span style={{ 
        ...styles.issueStatus, 
        color: isClosed ? colors.working : colors.primaryDim 
      }}>
        {isClosed ? '✓' : '…'}
      </span>
      <span style={styles.issueId}>{issue.id}</span>
      <span style={styles.issueType}>[{issue.issueType?.toUpperCase()}]</span>
      <span style={styles.issueTitle}>{issue.title}</span>
      {issue.assignee && (
        <span style={styles.issueAssignee}>@{issue.assignee.split('/').pop()}</span>
      )}
    </div>
  );
}

const colors = {
  primary: 'var(--crt-phosphor)',
  primaryBright: 'var(--crt-phosphor-bright)',
  primaryDim: 'var(--crt-phosphor-dim)',
  background: '#0A0A0A',
  backgroundDark: '#050505',
  panelBorder: 'var(--crt-phosphor-dim)',
  working: 'var(--crt-phosphor-bright)',
  stuck: '#FF4444',
} as const;

const styles = {
  container: {
    border: `1px solid ${colors.panelBorder}`,
    backgroundColor: colors.backgroundDark,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"Share Tech Mono", "Courier New", monospace',
    transition: 'all 0.2s ease',
  },
  mainRow: {
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    cursor: 'pointer',
    minHeight: '64px',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '140px',
  },
  statusIcon: {
    fontSize: '1.2rem',
  },
  idGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  id: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  priority: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
  },
  middleSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    color: colors.primary,
    fontSize: '1rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusBadge: {
    fontSize: '0.6rem',
    padding: '0px 4px',
    border: `1px solid ${colors.primaryDim}`,
    color: colors.primaryDim,
    flexShrink: 0,
  },
  metadataRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    fontSize: '0.7rem',
  },
  activityTime: {
    color: colors.primaryDim,
  },
  metaDivider: {
    color: 'var(--crt-phosphor-glow)',
  },
  workerList: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  workerChip: {
    color: colors.primaryBright,
    backgroundColor: 'var(--crt-phosphor-glow)',
    padding: '0 4px',
    fontSize: '0.65rem',
  },
  unassigned: {
    color: colors.primaryDim,
    fontStyle: 'italic',
    fontSize: '0.65rem',
  },
  rightSection: {
    minWidth: '140px',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '16px',
  },
  progressContainer: {
    width: '80px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  progressLabel: {
    textAlign: 'center',
    fontSize: '0.75rem',
    color: colors.primary,
  },
  progressBarBg: {
    height: '4px',
    backgroundColor: 'rgba(10, 122, 62, 0.2)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  singleProgress: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    letterSpacing: '0.05em',
  },
  expandIcon: {
    fontSize: '0.7rem',
    color: colors.primaryDim,
    transition: 'transform 0.2s ease',
  },
  detailsArea: {
    padding: '12px 16px',
    borderTop: `1px solid var(--crt-phosphor-dim)`,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  detailsHeader: {
    fontSize: '0.7rem',
    color: colors.primaryDim,
    marginBottom: '8px',
    letterSpacing: '0.1em',
  },
  issueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  issueRow: {
    display: 'flex',
    gap: '10px',
    fontSize: '0.75rem',
    alignItems: 'center',
  },
  issueStatus: {
    fontSize: '0.9rem',
    width: '12px',
  },
  issueId: {
    color: colors.primary,
    minWidth: '60px',
  },
  issueType: {
    color: colors.primaryDim,
    fontSize: '0.65rem',
    minWidth: '50px',
  },
  issueTitle: {
    flex: 1,
    color: colors.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  issueAssignee: {
    color: colors.primaryBright,
    fontSize: '0.7rem',
  },
} satisfies Record<string, CSSProperties>;
