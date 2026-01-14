import { useState, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { api } from '../../services/api';

/**
 * Floating Quick Input component for sending direct messages to the Mayor.
 * Appears at the bottom of the screen regardless of the active tab.
 */
export function QuickInput() {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [text]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;

    setSending(true);
    setStatus('idle');

    try {
      await api.mail.send({
        to: 'mayor/',
        subject: `Quick Message: ${text.slice(0, 30)}${text.length > 30 ? '...' : ''}`,
        body: text,
        priority: 2, // Normal
        type: 'notification',
      });
      
      setText('');
      setStatus('success');
      
      // Reset success status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to send quick message:', err);
      setStatus('error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>TO: MAYOR</span>
        {status === 'success' && <span style={styles.success}>MESSAGE SENT</span>}
        {status === 'error' && <span style={styles.error}>ERROR SENDING</span>}
      </div>
      <div style={styles.inputRow}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type message to Mayor... (Ctrl+Enter to send)"
          style={styles.textarea}
          rows={1}
          disabled={sending}
        />
        <button
          onClick={() => void handleSend()}
          disabled={!text.trim() || sending}
          style={{
            ...styles.sendButton,
            ...(text.trim() && !sending ? {} : styles.sendButtonDisabled),
          }}
        >
          {sending ? '...' : 'SEND'}
        </button>
      </div>
    </div>
  );
}

// Pip-Boy color palette
const colors = {
  primary: '#14F07D',
  primaryDim: '#0A7A3E',
  primaryGlow: '#14F07D40',
  background: 'rgba(10, 10, 10, 0.95)', // Slightly transparent background
  success: '#14F07D',
  error: '#FF4444',
} as const;

const styles = {
  container: {
    position: 'absolute',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    maxWidth: '90vw',
    backgroundColor: colors.background,
    border: `2px solid ${colors.primary}`,
    borderRadius: '4px',
    padding: '12px',
    boxShadow: `0 0 15px ${colors.primaryGlow}, inset 0 0 10px ${colors.primaryGlow}`,
    fontFamily: '"Share Tech Mono", "Courier New", monospace',
    color: colors.primary,
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    letterSpacing: '0.1em',
  },
  label: {
    backgroundColor: colors.primaryDim,
    color: '#000',
    padding: '2px 6px',
    borderRadius: '2px',
  },
  success: {
    color: colors.success,
    textShadow: `0 0 5px ${colors.success}`,
    animation: 'blink 1s ease-in-out infinite',
  },
  error: {
    color: colors.error,
    textShadow: `0 0 5px ${colors.error}`,
  },
  inputRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: `1px dashed ${colors.primaryDim}`,
    color: colors.primary,
    fontFamily: 'inherit',
    fontSize: '1rem',
    lineHeight: '1.5',
    outline: 'none',
    resize: 'none',
    minHeight: '24px',
    maxHeight: '150px',
    padding: '4px 0',
    overflowY: 'auto',
  },
  sendButton: {
    backgroundColor: colors.primary,
    color: '#000',
    border: 'none',
    borderRadius: '2px',
    padding: '6px 16px',
    fontFamily: 'inherit',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.9rem',
    letterSpacing: '0.05em',
    transition: 'all 0.2s',
    minWidth: '80px',
    height: '32px',
  },
  sendButtonDisabled: {
    backgroundColor: colors.primaryDim,
    opacity: 0.5,
    cursor: 'not-allowed',
  },
} satisfies Record<string, CSSProperties>;
