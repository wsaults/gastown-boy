import React from 'react';
import { useDashboardMail } from '../../hooks/useDashboardMail';
import { useDashboardConvoys } from '../../hooks/useDashboardConvoys';
import { useDashboardCrew } from '../../hooks/useDashboardCrew';
import { ConvoyCard } from '../convoys/ConvoyCard';
import './DashboardView.css';

// Simple widget wrapper for dashboard sections
interface DashboardWidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({ title, children, className }) => (
  <div className={`dashboard-widget-container ${className || ''}`}>
    <h3 className="dashboard-widget-title">{title}</h3>
    <div className="dashboard-widget-content">{children}</div>
  </div>
);

/**
 * DashboardView component displays a snapshot of information from other tabs.
 */
/** Format relative timestamp */
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function DashboardView() {
  const { unreadMessages, recentMessages, totalCount: mailTotal, unreadCount, loading: mailLoading, error: mailError } = useDashboardMail();
  const { recentConvoys, loading: convoysLoading, error: convoysError } = useDashboardConvoys();
  const { totalCrew, activeCrew, statusBreakdown, recentlyActive, idleCrew, totalUnreadMail, crewAlerts, loading: crewLoading, error: crewError } = useDashboardCrew();



  return (
    <div className="dashboard-view-container">

      <div className="dashboard-view-grid">
        {/* Mail Widget */}
        <DashboardWidget title="MAIL">
          {mailLoading && <p>Loading mail...</p>}
          {mailError && <p className="dashboard-view-error-text">Error: {mailError}</p>}
          {!mailLoading && !mailError && (
            <>
              <div className="dashboard-stats-row">
                <span className="dashboard-stat">
                  <span className="dashboard-stat-value">{mailTotal}</span>
                  <span className="dashboard-stat-label">TOTAL</span>
                </span>
                <span className="dashboard-stat">
                  <span className={`dashboard-stat-value ${unreadCount > 0 ? 'dashboard-stat-highlight' : ''}`}>{unreadCount}</span>
                  <span className="dashboard-stat-label">UNREAD</span>
                </span>
              </div>
              {unreadMessages.length > 0 && (
                <>
                  <p className="dashboard-view-sub-title">Unread:</p>
                  <ul className="dashboard-view-list">
                    {unreadMessages.map((msg) => (
                      <li key={msg.id} className="dashboard-view-list-item">
                        <div className="dashboard-mail-item">
                          <span className="dashboard-mail-subject">{msg.subject}</span>
                          <span className="dashboard-mail-meta">
                            <span className="dashboard-mail-from">{msg.from.replace(/\/$/, '')}</span>
                            <span className="dashboard-mail-time">{formatRelativeTime(msg.timestamp)}</span>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {(unreadMessages.length === 0 && recentMessages.length > 0) && (
                <>
                  <p className="dashboard-view-sub-title">Recent:</p>
                  <ul className="dashboard-view-list">
                    {recentMessages.map((msg) => (
                      <li key={msg.id} className="dashboard-view-list-item">
                        <div className="dashboard-mail-item">
                          <span className="dashboard-mail-subject">{msg.subject}</span>
                          <span className="dashboard-mail-meta">
                            <span className="dashboard-mail-from">{msg.from.replace(/\/$/, '')}</span>
                            <span className="dashboard-mail-time">{formatRelativeTime(msg.timestamp)}</span>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {(unreadMessages.length === 0 && recentMessages.length === 0) && (
                <p className="dashboard-empty-text">No messages</p>
              )}
            </>
          )}
        </DashboardWidget>

        {/* Crew Widget */}
        <DashboardWidget title="CREW">
          {crewLoading && <p>Loading crew data...</p>}
          {crewError && <p className="dashboard-view-error-text">Error: {crewError}</p>}
          {!crewLoading && !crewError && (
            <>
              <div className="dashboard-stats-row">
                <span className="dashboard-stat">
                  <span className="dashboard-stat-value">{totalCrew}</span>
                  <span className="dashboard-stat-label">TOTAL</span>
                </span>
                <span className="dashboard-stat">
                  <span className="dashboard-stat-value">{activeCrew}</span>
                  <span className="dashboard-stat-label">ACTIVE</span>
                </span>
                {totalUnreadMail > 0 && (
                  <span className="dashboard-stat">
                    <span className="dashboard-stat-value dashboard-stat-highlight">{totalUnreadMail}</span>
                    <span className="dashboard-stat-label">UNREAD MAIL</span>
                  </span>
                )}
              </div>
              <div className="dashboard-status-breakdown">
                {statusBreakdown.working > 0 && (
                  <span className="dashboard-status-badge dashboard-status-working">
                    {statusBreakdown.working} working
                  </span>
                )}
                {statusBreakdown.idle > 0 && (
                  <span className="dashboard-status-badge dashboard-status-idle">
                    {statusBreakdown.idle} idle
                  </span>
                )}
                {statusBreakdown.blocked > 0 && (
                  <span className="dashboard-status-badge dashboard-status-blocked">
                    {statusBreakdown.blocked} blocked
                  </span>
                )}
                {statusBreakdown.stuck > 0 && (
                  <span className="dashboard-status-badge dashboard-status-stuck">
                    {statusBreakdown.stuck} stuck
                  </span>
                )}
                {statusBreakdown.offline > 0 && (
                  <span className="dashboard-status-badge dashboard-status-offline">
                    {statusBreakdown.offline} offline
                  </span>
                )}
              </div>
              {crewAlerts.length > 0 && (
                <>
                  <p className="dashboard-view-sub-title dashboard-view-error-text">Alerts:</p>
                  <ul className="dashboard-view-list">
                    {crewAlerts.map((alert, index) => (
                      <li key={index} className="dashboard-view-list-item dashboard-view-error-text">{alert}</li>
                    ))}
                  </ul>
                </>
              )}
              {recentlyActive.length > 0 && (
                <>
                  <p className="dashboard-view-sub-title">Working:</p>
                  <ul className="dashboard-view-list">
                    {recentlyActive.map((crew) => (
                      <li key={crew.name} className="dashboard-view-list-item">
                        <span className="dashboard-crew-name">{crew.name}</span>
                        <span className={`dashboard-crew-status dashboard-status-${crew.status}`}>
                          {crew.status}
                        </span>
                        {crew.currentTask && (
                          <span className="dashboard-crew-task">{crew.currentTask}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {recentlyActive.length === 0 && idleCrew.length > 0 && (
                <>
                  <p className="dashboard-view-sub-title">Available:</p>
                  <ul className="dashboard-view-list">
                    {idleCrew.map((crew) => (
                      <li key={crew.name} className="dashboard-view-list-item">
                        <span className="dashboard-crew-name">{crew.name}</span>
                        <span className="dashboard-crew-status dashboard-status-idle">idle</span>
                        {crew.unreadMail > 0 && (
                          <span className="dashboard-crew-mail">{crew.unreadMail} unread</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {totalCrew === 0 && (
                <p className="dashboard-empty-text">No crew members</p>
              )}
            </>
          )}
        </DashboardWidget>

        {/* Convoys Widget */}
        <DashboardWidget title="UNFINISHED CONVOYS" className="dashboard-widget-full-width">
          {convoysLoading && <p>Loading convoys...</p>}
          {convoysError && <p className="dashboard-view-error-text">Error: {convoysError}</p>}
          {!convoysLoading && !convoysError && (
            <>
              {recentConvoys.length > 0 ? (
                <div className="dashboard-convoy-list">
                  {recentConvoys.map((convoy) => (
                    <ConvoyCard key={convoy.id} convoy={convoy} />
                  ))}
                </div>
              ) : (
                <p className="dashboard-empty-text">No active convoys</p>
              )}
            </>
          )}
        </DashboardWidget>


      </div>
    </div>
  );
}

export default DashboardView;