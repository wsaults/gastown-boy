import React, { useRef, useEffect } from 'react';
import { useEventStream, type StreamEvent } from '../../hooks/useEventStream';
import './EventStreamPanel.css';

/** Format timestamp to HH:MM:SS */
function formatTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/** Shorten actor paths for display: "gastownBoy/polecats/rust" → "rust" */
function shortActor(actor: string): string {
  const parts = actor.replace(/\/$/, '').split('/');
  return parts[parts.length - 1] ?? actor;
}

/** Color class for event type */
function typeColorClass(type: string): string {
  switch (type) {
    case 'done':
    case 'merged':
    case 'patrol_complete':
      return 'event-type-success';
    case 'kill':
    case 'halt':
    case 'session_death':
      return 'event-type-danger';
    case 'nudge':
    case 'unhook':
      return 'event-type-warning';
    case 'mail':
      return 'event-type-info';
    default:
      return 'event-type-default';
  }
}

interface EventRowProps {
  event: StreamEvent;
}

const EventRow: React.FC<EventRowProps> = React.memo(({ event }) => (
  <div className={`event-row ${typeColorClass(event.type)}`}>
    <span className="event-time">{formatTime(event.ts)}</span>
    <span className="event-symbol">{event.symbol}</span>
    <span className="event-type-label">{event.type}</span>
    <span className="event-actor">{shortActor(event.actor)}</span>
    {event.payload && Object.keys(event.payload).length > 0 && (
      <span className="event-payload">
        {formatPayload(event)}
      </span>
    )}
  </div>
));

EventRow.displayName = 'EventRow';

/** Extract a human-readable summary from event payload */
function formatPayload(event: StreamEvent): string {
  const p = event.payload;
  if (p['bead']) return String(p['bead']);
  if (p['subject']) return String(p['subject']);
  if (p['reason']) return String(p['reason']);
  if (p['target']) return String(p['target']);
  if (p['session_id']) return `session:${String(p['session_id']).slice(0, 8)}`;
  return '';
}

interface EventStreamPanelProps {
  isActive?: boolean;
}

export function EventStreamPanel({ isActive = false }: EventStreamPanelProps) {
  const { events, status, error } = useEventStream(isActive);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new events
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  return (
    <div className="event-stream-panel">
      <div className="event-stream-header">
        <div className="event-stream-title-row">
          <h3 className="event-stream-title">EVENT FEED</h3>
          <span className={`event-stream-status event-stream-status-${status}`}>
            {status === 'connected' ? 'LIVE' : status === 'connecting' ? 'CONNECTING' : 'OFFLINE'}
          </span>
        </div>
        {error && <span className="event-stream-error">{error}</span>}
      </div>
      <div className="event-stream-body" ref={scrollRef}>
        {events.length === 0 ? (
          <p className="event-stream-empty">
            {status === 'connected' ? 'No events yet. Waiting for activity...' : 'Connecting to event stream...'}
          </p>
        ) : (
          events.map((event, i) => (
            <EventRow key={`${event.ts}-${event.type}-${i}`} event={event} />
          ))
        )}
      </div>
    </div>
  );
}

export default EventStreamPanel;
