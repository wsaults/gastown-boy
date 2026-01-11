# Feature Specification: Pip-Boy UI for Gastown

**Feature Branch**: `001-pipboy-ui`
**Created**: 2026-01-11
**Status**: Draft
**Input**: User description: "Pip-Boy themed UI for gastown with split-view mail inbox/outbox for Mayor communication, power button to start/stop gastown, and crew member stats dashboard"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mayor Mail Communication (Priority: P1)

As a gastown operator, I want to view and manage messages with the Mayor in a split-view interface so I can efficiently read incoming directives and compose responses without losing context.

**Why this priority**: The Mayor is the primary coordination point in gastown. Without mail communication, users cannot issue work requests or receive results from the multi-agent system. This is the core interaction loop.

**Independent Test**: Can be fully tested by sending a message to the Mayor and viewing the response in the split-view interface. Delivers immediate value as the primary gastown interaction mechanism.

**Acceptance Scenarios**:

1. **Given** the user opens the mail interface, **When** messages exist from the Mayor, **Then** a list of messages appears in the left panel sorted by newest first
2. **Given** a message list is displayed, **When** the user selects a message, **Then** the full message content appears in the right panel
3. **Given** the user is viewing a message, **When** they click "Compose" or "Reply", **Then** a text input area appears for drafting a new message
4. **Given** the user has drafted a message, **When** they click "Send", **Then** the message is transmitted to the Mayor and appears in the sent messages list
5. **Given** the user is composing a message, **When** they click "Cancel", **Then** the draft is discarded and the view returns to the message list

---

### User Story 2 - Gastown Power Controls (Priority: P2)

As a gastown operator, I want a clear power button to start and stop the gastown system so I can control when the multi-agent orchestration is active.

**Why this priority**: Power control is essential for managing gastown lifecycle but depends on having a reason to start it (sending work to the Mayor). Secondary to mail but critical for system management.

**Independent Test**: Can be tested by toggling the power button and observing gastown state change. Delivers value as standalone system control even without mail functionality.

**Acceptance Scenarios**:

1. **Given** gastown is currently stopped, **When** the user clicks the power button, **Then** gastown begins starting up and the button shows a "starting" state
2. **Given** gastown is running, **When** the user clicks the power button, **Then** gastown begins shutting down and the button shows a "stopping" state
3. **Given** gastown is in a transitional state (starting/stopping), **When** the user views the power button, **Then** the button is visually distinct and indicates the current transition
4. **Given** gastown completes a state transition, **When** the transition finishes, **Then** the button updates to reflect the new stable state (on/off)

---

### User Story 3 - Crew Member Stats Dashboard (Priority: P3)

As a gastown operator, I want to see the current status of all crew members so I can monitor agent activity and workload at a glance.

**Why this priority**: Monitoring is valuable but not required for basic gastown operation. Users can effectively use mail and power controls without detailed crew visibility. This enhances situational awareness.

**Independent Test**: Can be tested by viewing the stats dashboard while gastown is running and verifying crew member information displays correctly. Delivers value as a monitoring tool.

**Acceptance Scenarios**:

1. **Given** gastown is running, **When** the user views the crew stats, **Then** a list of active crew members appears with their current status
2. **Given** crew members are displayed, **When** a crew member's status changes, **Then** the display updates to reflect the new status within a reasonable time
3. **Given** gastown is stopped, **When** the user views the crew stats, **Then** an appropriate empty or "offline" state is shown

---

### Edge Cases

- What happens when gastown is unreachable or the connection is lost?
  - Display a connection error indicator and disable interactive controls until reconnected
- What happens when the user attempts to send a message while gastown is stopped?
  - Show a clear message that gastown must be running to communicate with the Mayor
- What happens when a message fails to send?
  - Display an error notification and preserve the draft for retry
- What happens when the crew stats contain a large number of members?
  - The list should be scrollable; performance should remain acceptable up to 50 crew members

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display incoming Mayor messages in a scrollable list view
- **FR-002**: System MUST display selected message content in a detail panel alongside the message list (split-view)
- **FR-003**: System MUST provide a compose interface for drafting new messages to the Mayor
- **FR-004**: System MUST transmit composed messages to the gastown Mayor endpoint
- **FR-005**: System MUST display a power button indicating current gastown state (on/off/transitioning)
- **FR-006**: System MUST send start/stop commands to gastown when the power button is activated
- **FR-007**: System MUST display a list of crew members with their current status when gastown is running
- **FR-008**: System MUST apply a Fallout Pip-Boy visual theme consistently across all UI elements
- **FR-009**: System MUST handle connection errors gracefully with user-visible feedback
- **FR-010**: System MUST preserve message drafts if sending fails, allowing retry
- **FR-011**: System MUST operate without authentication when accessed via localhost
- **FR-012**: System SHOULD support remote access via tunneling services (e.g., ngrok) without requiring code changes

### Key Entities

- **Message**: A communication unit between the user and the Mayor. Contains sender, recipient, timestamp, subject (optional), and body content. Messages can be incoming (from Mayor) or outgoing (to Mayor).
- **GastownState**: The operational state of the gastown system. States include: stopped, starting, running, stopping.
- **CrewMember**: A participant in the gastown workspace. Contains identifier, display name, current status (idle, working, blocked), and optionally current task description.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can read a Mayor message within 3 clicks from application launch
- **SC-002**: Users can compose and send a message to the Mayor in under 60 seconds
- **SC-003**: Power state changes are reflected in the UI within 2 seconds of gastown state change
- **SC-004**: Crew member status updates appear in the dashboard within 5 seconds of change
- **SC-005**: The UI maintains smooth animations (no visible stuttering) during normal operation
- **SC-006**: Users can identify gastown's current state (on/off/transitioning) at a glance without reading text labels

## Clarifications

### Session 2026-01-11

- Q: What authentication model should be used? → A: No authentication (localhost-first); optional remote access via tunnel (ngrok or similar)
- Q: How should UI receive real-time updates? → A: Deferred to planning phase; requires investigation of gastown API capabilities (https://github.com/steveyegge/gastown)
- Q: Where does message history live? → A: Stateless UI; fetch all messages from gastown on demand, no local storage

## Assumptions

- Gastown exposes an API or communication mechanism for sending/receiving Mayor messages
- Gastown provides status endpoints for querying power state and crew member information
- The gastown system handles its own persistence; the UI is a fully stateless client with no local storage
- Message history is fetched from gastown on each view; UI does not cache messages
- Standard web browser environment (Chrome, Firefox, Safari, Edge - latest versions)
- Users have basic familiarity with the Fallout Pip-Boy aesthetic
