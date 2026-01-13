import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { usePolling } from '../../hooks/usePolling';
import type { GastownStatus, PowerState } from '../../types';
import './NuclearPowerButton.css';

/**
 * Nuclear launch-style power button with flip-up safety cover.
 * Always visible in header, provides dramatic power control.
 */
export function NuclearPowerButton() {
  const { data, refresh } = usePolling<GastownStatus>(() => api.getStatus(), {
    interval: 2000,
  });

  const [isArmed, setIsArmed] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [actionState, setActionState] = useState<PowerState | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const powerState = actionState ?? data?.powerState ?? null;
  const isRunning = powerState === 'running';
  const isStopped = powerState === 'stopped';
  const isTransitioning = powerState === 'starting' || powerState === 'stopping';

  // Reset action state when server catches up
  useEffect(() => {
    if (data?.powerState && actionState === data.powerState) {
      setActionState(null);
    }
  }, [actionState, data?.powerState]);

  // Auto-close cover after successful action
  useEffect(() => {
    if (!isTransitioning && !actionLoading && isArmed) {
      const timer = setTimeout(() => setIsArmed(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, actionLoading, isArmed]);

  const handleCoverToggle = useCallback(() => {
    if (!isTransitioning && !actionLoading) {
      setIsArmed(prev => !prev);
    }
  }, [isTransitioning, actionLoading]);

  const handleButtonPress = useCallback(async () => {
    if (!isArmed || isTransitioning || actionLoading || !powerState) return;

    setIsPressed(true);
    setActionLoading(true);

    try {
      if (isRunning) {
        setActionState('stopping');
        const result = await api.power.down();
        setActionState(result.newState);
      } else if (isStopped) {
        setActionState('starting');
        const result = await api.power.up();
        setActionState(result.newState);
      }
    } catch {
      // Error handling - reset states
      setActionState(null);
    } finally {
      setActionLoading(false);
      setIsPressed(false);
      void refresh();
    }
  }, [isArmed, isTransitioning, actionLoading, powerState, isRunning, isStopped, refresh]);

  const statusClass = isRunning
    ? 'status-online'
    : isStopped
      ? 'status-offline'
      : isTransitioning
        ? 'status-transitioning'
        : 'status-unknown';

  const buttonLabel = isRunning ? 'SHUTDOWN' : isStopped ? 'IGNITE' : 'WAIT';

  return (
    <div className={`nuclear-power-button ${statusClass}`}>
      {/* Housing frame */}
      <div className="nuclear-housing">
        {/* Hazard stripes background */}
        <div className="hazard-stripes" />

        {/* Corner screws */}
        <div className="screw screw-tl" />
        <div className="screw screw-tr" />
        <div className="screw screw-bl" />
        <div className="screw screw-br" />

        {/* Warning label */}
        <div className="warning-label">
          <span className="warning-text">DANGER</span>
        </div>

        {/* The flip cover */}
        <button
          type="button"
          className={`flip-cover ${isArmed ? 'armed' : ''}`}
          onClick={handleCoverToggle}
          disabled={isTransitioning || actionLoading}
          aria-label={isArmed ? 'Close safety cover' : 'Open safety cover'}
          aria-expanded={isArmed}
        >
          <div className="cover-surface">
            <div className="cover-stripes" />
            <div className="cover-handle" />
          </div>
          <div className="cover-hinge" />
        </button>

        {/* The big red button underneath */}
        <div className="button-well">
          <div className={`button-ring ${isArmed ? 'armed' : ''}`}>
            <button
              type="button"
              className={`launch-button ${isPressed ? 'pressed' : ''} ${isArmed ? 'exposed' : ''}`}
              onClick={() => void handleButtonPress()}
              disabled={!isArmed || isTransitioning || actionLoading}
              aria-label={`${buttonLabel} Gastown`}
            >
              <div className="button-surface">
                <div className="button-highlight" />
                <span className="button-label">{buttonLabel}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Status indicator LEDs */}
        <div className="status-leds">
          <div className={`led led-power ${isRunning ? 'on' : ''}`} title="Power" />
          <div className={`led led-armed ${isArmed ? 'on blink' : ''}`} title="Armed" />
          <div className={`led led-action ${actionLoading ? 'on blink-fast' : ''}`} title="Action" />
        </div>

        {/* Arm status text */}
        <div className={`arm-status ${isArmed ? 'armed' : ''}`}>
          {isArmed ? '▲ ARMED ▲' : '◄ SAFE ►'}
        </div>
      </div>
    </div>
  );
}

export default NuclearPowerButton;
