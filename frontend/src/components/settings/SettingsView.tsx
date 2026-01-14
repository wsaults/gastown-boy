import { useState, useCallback, useEffect, type CSSProperties } from 'react';

interface NgrokTunnel {
  public_url: string;
  proto: string;
  config: { addr: string };
}

interface NgrokApiResponse {
  tunnels: NgrokTunnel[];
}

type TunnelStatus = 'loading' | 'connected' | 'not-running' | 'error';

/**
 * Settings view component.
 * Displays system settings and connection info including the public URL for remote access.
 */
export function SettingsView() {
  const [copied, setCopied] = useState(false);
  const [tunnelStatus, setTunnelStatus] = useState<TunnelStatus>('loading');
  const [ngrokUrl, setNgrokUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check if we're already on ngrok
  const currentOrigin = window.location.origin;
  const isOnNgrok = currentOrigin.includes('ngrok');

  // Fetch ngrok tunnel info
  useEffect(() => {
    if (isOnNgrok) {
      // Already accessed via ngrok, use current URL
      setNgrokUrl(currentOrigin);
      setTunnelStatus('connected');
      return;
    }

    // Try to fetch from ngrok local API via Vite proxy (avoids CORS)
    const fetchNgrokUrl = async () => {
      try {
        const response = await fetch('/ngrok-api/api/tunnels', {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as NgrokApiResponse;

        // Find the https tunnel (prefer https over http)
        const httpsTunnel = data.tunnels.find((t) => t.proto === 'https');
        const httpTunnel = data.tunnels.find((t) => t.proto === 'http');
        const tunnel = httpsTunnel ?? httpTunnel;

        if (tunnel) {
          setNgrokUrl(tunnel.public_url);
          setTunnelStatus('connected');
        } else {
          setTunnelStatus('not-running');
          setErrorMsg('No tunnels found');
        }
      } catch (err) {
        // ngrok not running or not reachable
        setTunnelStatus('not-running');
        setErrorMsg(err instanceof Error ? err.message : 'Failed to connect');
      }
    };

    fetchNgrokUrl();
  }, [isOnNgrok, currentOrigin]);

  const displayUrl = ngrokUrl ?? currentOrigin;

  const handleCopy = useCallback(async () => {
    const urlToCopy = ngrokUrl ?? currentOrigin;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const input = document.createElement('input');
      input.value = urlToCopy;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [ngrokUrl, currentOrigin]);

  const getStatusText = () => {
    switch (tunnelStatus) {
      case 'loading':
        return '◐ CHECKING...';
      case 'connected':
        return '● TUNNEL ACTIVE';
      case 'not-running':
        return '○ TUNNEL NOT RUNNING';
      case 'error':
        return '✗ ERROR';
    }
  };

  const getStatusStyle = () => {
    switch (tunnelStatus) {
      case 'loading':
        return styles.statusLoading;
      case 'connected':
        return styles.statusConnected;
      case 'not-running':
      case 'error':
        return styles.statusDisconnected;
    }
  };

  return (
    <div style={styles.container}>
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>REMOTE ACCESS</h2>

        <div style={styles.field}>
          <span style={styles.label}>TUNNEL:</span>
          <span style={getStatusStyle()}>{getStatusText()}</span>
        </div>

        {tunnelStatus === 'connected' && ngrokUrl && (
          <>
            <div style={styles.field}>
              <span style={styles.label}>PUBLIC URL:</span>
              <div style={styles.urlContainer}>
                <code style={styles.urlText}>{displayUrl}</code>
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
              Share this URL to access GASTOWN-BOY from other devices.
            </p>
          </>
        )}

        {tunnelStatus === 'not-running' && (
          <div style={styles.instructions}>
            <p style={styles.instructionText}>
              To enable remote access, start the ngrok tunnel:
            </p>
            <code style={styles.codeBlock}>./scripts/tunnel.sh</code>
            {errorMsg && (
              <p style={styles.errorText}>Debug: {errorMsg}</p>
            )}
          </div>
        )}

        {tunnelStatus === 'loading' && (
          <p style={styles.hint}>Checking for ngrok tunnel...</p>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>LOCAL ACCESS</h2>

        <div style={styles.field}>
          <span style={styles.label}>LOCAL URL:</span>
          <div style={styles.urlContainer}>
            <code style={styles.urlText}>{currentOrigin}</code>
          </div>
        </div>
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
  red: '#FF4444',
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

  statusLoading: {
    color: colors.primaryDim,
  },

  statusConnected: {
    color: colors.amber,
    textShadow: `0 0 8px ${colors.amber}`,
  },

  statusDisconnected: {
    color: colors.primaryDim,
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

  instructions: {
    marginTop: '1rem',
    padding: '0.75rem',
    background: colors.background,
    border: `1px dashed ${colors.primaryDim}`,
    borderRadius: '2px',
  },

  instructionText: {
    fontSize: '0.8rem',
    color: colors.primaryDim,
    margin: '0 0 0.5rem 0',
  },

  codeBlock: {
    display: 'block',
    padding: '0.5rem',
    background: '#000',
    border: `1px solid ${colors.primaryDim}`,
    borderRadius: '2px',
    fontSize: '0.85rem',
    color: colors.primary,
  },

  errorText: {
    fontSize: '0.7rem',
    color: colors.primaryDim,
    marginTop: '0.5rem',
    marginBottom: 0,
    opacity: 0.7,
  },
} satisfies Record<string, CSSProperties>;

export default SettingsView;
