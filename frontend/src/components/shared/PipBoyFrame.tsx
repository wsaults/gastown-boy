import type { ReactNode, CSSProperties } from 'react';

/**
 * Props for the PipBoyFrame layout component
 */
export interface PipBoyFrameProps {
  /** Content to render inside the frame */
  children: ReactNode;
  /** Optional title displayed in the frame header */
  title?: string;
  /** Optional additional CSS class name */
  className?: string;
}

/**
 * Pip-Boy themed frame component that wraps content with the classic
 * Fallout terminal aesthetic - green phosphor glow, CRT-style borders,
 * and dark background.
 */
export function PipBoyFrame({ children, title, className = '' }: PipBoyFrameProps) {
  return (
    <div style={styles.container} className={className}>
      <div style={styles.outerFrame}>
        <div style={styles.innerFrame}>
          {title && (
            <header style={styles.header}>
              <h1 style={styles.title}>{title}</h1>
              <div style={styles.headerLine} />
            </header>
          )}
          <main style={styles.content}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

// Pip-Boy color palette
const colors = {
  primary: '#14F07D',      // Classic Pip-Boy green
  primaryDim: '#0A7A3E',   // Dimmed green for borders
  primaryGlow: '#14F07D40', // Green with transparency for glow
  background: '#0A0A0A',   // Near-black background
  backgroundDark: '#050505', // Darker background for depth
} as const;

const styles = {
  container: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: colors.backgroundDark,
    padding: '16px',
    boxSizing: 'border-box',
    fontFamily: '"Share Tech Mono", "Courier New", monospace',
  },

  outerFrame: {
    minHeight: 'calc(100vh - 32px)',
    border: `3px solid ${colors.primaryDim}`,
    borderRadius: '8px',
    padding: '4px',
    backgroundColor: colors.background,
    boxShadow: `
      0 0 10px ${colors.primaryGlow},
      inset 0 0 20px rgba(0, 0, 0, 0.8)
    `,
  },

  innerFrame: {
    minHeight: 'calc(100vh - 48px)',
    border: `1px solid ${colors.primary}`,
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  header: {
    padding: '12px 16px 8px',
    borderBottom: `1px solid ${colors.primaryDim}`,
  },

  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 400,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    textShadow: `0 0 8px ${colors.primaryGlow}`,
  },

  headerLine: {
    height: '2px',
    background: `linear-gradient(90deg, ${colors.primary}, transparent)`,
    marginTop: '8px',
  },

  content: {
    flex: 1,
    padding: '16px',
    color: colors.primary,
    overflow: 'auto',
  },
} satisfies Record<string, CSSProperties>;

export default PipBoyFrame;
