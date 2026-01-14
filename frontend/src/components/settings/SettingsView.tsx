import { useState, useCallback, type CSSProperties } from 'react';

/**
 * Settings view component.
 * Displays system settings and connection info including the public URL for remote access.
 */
export function SettingsView() {
  const [copied, setCopied] = useState(false);
  const currentUrl = window.location.origin;
  const isNgrok = currentUrl.includes('ngrok');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const input = document.createElement('input');
      input.value = currentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [currentUrl]);

  return (
    <div style={styles.container}>
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>CONNECTION</h2>

        <div style={styles.field}>
          <span style={styles.label}>STATUS:</span>
          <span style={isNgrok ? styles.statusRemote : styles.statusLocal}>
            {isNgrok ? '● REMOTE (NGROK)' : '● LOCAL'}
          </span>
        </div>

        <div style={styles.field}>
          <span style={styles.label}>PUBLIC URL:</span>
          <div style={styles.urlContainer}>
            <code style={styles.urlText}>{currentUrl}</code>
            <button
              type="button"
              style={styles.copyButton}
              onClick={handleCopy}
            >
              {copied ? '✓ COPIED' : 'COPY'}
            </button>
          </div>
        </div>

        <p style={styles.hint}>
          {isNgrok
            ? 'Share this URL to access GASTOWN-BOY from other devices.'
            : 'Start ngrok tunnel for remote access: ./scripts/tunnel.sh'}
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>SYSTEM INFO</h2>

        <div style={styles.field}>
          <span style={styles.label}>VERSION:</span>
          <span style={styles.value}>v52.5</span>
        </div>

        <div style={styles.field}>
          <span style={styles.label}>PLATFORM:</span>
          <span style={styles.value}>{navigator.platform.toUpperCase()}</span>
        </div>
      </section>
    </div>
  );
}

const colors = {
  primary: '#14F07D',
  primaryDim: '#0A7A3E',
  primaryGlow: '#14F07D40',
  background: '#0A0A0A',
  amber: '#FFAA00',
} as const;

const styles = {
  container: {
    padding: '1rem',
    fontFamily: '"Share Tech Mono", "Courier New", monospace',
    color: colors.primary,
  },

  section: {
    marginBottom: '2rem',
    padding: '1rem',
    border: `1px solid ${colors.primaryDim}`,
    borderRadius: '2px',
  },

  sectionTitle: {
    fontSize: '1rem',
    letterSpacing: '0.2em',
    marginTop: 0,
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: `1px solid ${colors.primaryDim}`,
  },

  field: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '0.75rem',
  },

  label: {
    color: colors.primaryDim,
    minWidth: '120px',
    letterSpacing: '0.1em',
  },

  value: {
    color: colors.primary,
  },

  statusLocal: {
    color: colors.primary,
  },

  statusRemote: {
    color: colors.amber,
    textShadow: `0 0 8px ${colors.amber}`,
  },

  urlContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: 1,
  },

  urlText: {
    padding: '0.5rem 0.75rem',
    background: colors.background,
    border: `1px solid ${colors.primaryDim}`,
    borderRadius: '2px',
    fontSize: '0.85rem',
    wordBreak: 'break-all',
    flex: 1,
  } as CSSProperties,

  copyButton: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: `1px solid ${colors.primaryDim}`,
    borderRadius: '2px',
    color: colors.primary,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    transition: 'all 0.1s',
    whiteSpace: 'nowrap',
  } as CSSProperties,

  hint: {
    fontSize: '0.75rem',
    color: colors.primaryDim,
    marginTop: '1rem',
    marginBottom: 0,
    fontStyle: 'italic',
  },
} satisfies Record<string, CSSProperties>;

export default SettingsView;
