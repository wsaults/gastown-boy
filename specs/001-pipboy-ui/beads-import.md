# Pip-Boy UI for Gastown - Beads

**Feature**: 001-pipboy-ui
**Generated**: 2026-01-11
**Source**: specs/001-pipboy-ui/tasks.md

## Root Epic

- **Title**: Pip-Boy UI for Gastown
- **Type**: epic
- **Priority**: 1
- **Description**: Fallout Pip-Boy themed web UI for gastown: split-view mail for Mayor communication, power controls, and crew stats dashboard

## Epics

### Setup: Project Initialization
- **Type**: epic
- **Priority**: 1
- **Description**: Project initialization and basic structure for monorepo with backend and frontend
- **Tasks**: 9

### Foundational: Core Infrastructure
- **Type**: epic
- **Priority**: 1
- **Description**: Core infrastructure that MUST be complete before ANY user story
- **Blocks**: US1, US2, US3
- **Tasks**: 17

### US1: Mayor Mail Communication
- **Type**: epic
- **Priority**: 1
- **Description**: Split-view mail interface for viewing and composing messages to the Mayor
- **MVP**: true
- **Tasks**: 12

### US2: Gastown Power Controls
- **Type**: epic
- **Priority**: 2
- **Description**: Power button to start and stop gastown with clear state indication
- **Tasks**: 11

### US3: Crew Member Stats Dashboard
- **Type**: epic
- **Priority**: 3
- **Description**: Dashboard showing all crew members with their current status
- **Tasks**: 8

### Polish: Cross-Cutting Concerns
- **Type**: epic
- **Priority**: 4
- **Description**: Documentation, validation, and performance improvements
- **Depends**: US1, US2, US3
- **Tasks**: 7

## Tasks

### Setup

| Title | Path |
|-------|------|
| Create monorepo structure with backend/ and frontend/ directories | . |
| Initialize backend Node.js project with TypeScript | backend/package.json |
| Initialize frontend Vite + React project with TypeScript | frontend/package.json |
| Configure ESLint and Prettier for backend | backend/.eslintrc.js |
| Configure ESLint and Prettier for frontend | frontend/.eslintrc.js |
| Configure TypeScript strict mode for backend | backend/tsconfig.json |
| Configure TypeScript strict mode for frontend | frontend/tsconfig.json |
| Configure Vitest for backend | backend/vitest.config.ts |
| Configure Vitest for frontend | frontend/vitest.config.ts |

### Foundational

| Title | Path |
|-------|------|
| Create shared TypeScript types (Message, GastownStatus, CrewMember, ApiResponse) | backend/src/types/index.ts |
| Create Zod validation schemas | backend/src/types/schemas.ts |
| Implement GT executor service (spawns gt commands, parses JSON output) | backend/src/services/gt-executor.ts |
| Write unit tests for GT executor | backend/tests/unit/gt-executor.test.ts |
| Setup Express app with CORS and JSON middleware | backend/src/index.ts |
| Create API response helpers | backend/src/utils/response.ts |
| Create error handling middleware | backend/src/middleware/error-handler.ts |
| Create frontend TypeScript types (mirror backend types) | frontend/src/types/index.ts |
| Create API client service | frontend/src/services/api.ts |
| Implement usePolling hook | frontend/src/hooks/usePolling.ts |
| Write unit tests for usePolling hook | frontend/tests/unit/usePolling.test.ts |
| Configure Tailwind CSS with Pip-Boy theme | frontend/tailwind.config.ts |
| Create global styles with CRT/scanline effects | frontend/src/styles/globals.css |
| Create Pip-Boy theme tokens | frontend/src/styles/pipboy-theme.ts |
| Create PipBoyFrame layout component | frontend/src/components/shared/PipBoyFrame.tsx |
| Create ScanlineOverlay effect component | frontend/src/components/shared/ScanlineOverlay.tsx |
| Create basic App shell with navigation | frontend/src/App.tsx |

### US1: Mayor Mail Communication

| Title | Path |
|-------|------|
| Write unit tests for mail-service | backend/tests/unit/mail-service.test.ts |
| Write unit tests for useMail hook | frontend/tests/unit/useMail.test.ts |
| Implement mail-service with listMail, getMessage, sendMail, markRead | backend/src/services/mail-service.ts |
| Create mail routes (GET/POST /api/mail, GET /api/mail/:id, POST /api/mail/:id/read) | backend/src/routes/mail.ts |
| Register mail routes in Express app | backend/src/index.ts |
| Implement useMail hook with fetch, send, markRead | frontend/src/hooks/useMail.ts |
| Create MailList component (message list with selection) | frontend/src/components/mail/MailList.tsx |
| Create MailDetail component (message content display) | frontend/src/components/mail/MailDetail.tsx |
| Create ComposeMessage component (subject, body, send/cancel) | frontend/src/components/mail/ComposeMessage.tsx |
| Create MailView container with split-view layout | frontend/src/components/mail/MailView.tsx |
| Integrate MailView into App with routing | frontend/src/App.tsx |
| Add error handling for send failures with draft preservation | frontend/src/components/mail/ComposeMessage.tsx |

### US2: Gastown Power Controls

| Title | Path |
|-------|------|
| Write unit tests for power-service | backend/tests/unit/power-service.test.ts |
| Write unit tests for useGastownStatus hook | frontend/tests/unit/useGastownStatus.test.ts |
| Implement power-service with powerUp, powerDown, getStatus | backend/src/services/power-service.ts |
| Create power routes (POST /api/power/up, POST /api/power/down) | backend/src/routes/power.ts |
| Create status route (GET /api/status) | backend/src/routes/status.ts |
| Register power and status routes in Express app | backend/src/index.ts |
| Implement useGastownStatus hook with polling | frontend/src/hooks/useGastownStatus.ts |
| Create PowerButton component with state visualization | frontend/src/components/power/PowerButton.tsx |
| Add power button animations for state transitions | frontend/src/components/power/PowerButton.tsx |
| Integrate PowerButton into App layout | frontend/src/App.tsx |
| Add connection error indicator to PipBoyFrame | frontend/src/components/shared/PipBoyFrame.tsx |

### US3: Crew Member Stats Dashboard

| Title | Path |
|-------|------|
| Write unit tests for status-service crew member transformation | backend/tests/unit/status-service.test.ts |
| Implement status-service with getCrewMembers transformation | backend/src/services/status-service.ts |
| Create agents route (GET /api/agents) | backend/src/routes/status.ts |
| Register agents route in Express app | backend/src/index.ts |
| Create CrewMemberCard component for individual agent display | frontend/src/components/crew/CrewMemberCard.tsx |
| Create CrewStats dashboard component | frontend/src/components/crew/CrewStats.tsx |
| Add offline/empty state handling to CrewStats | frontend/src/components/crew/CrewStats.tsx |
| Integrate CrewStats into App with navigation tab | frontend/src/App.tsx |

### Polish

| Title | Path |
|-------|------|
| Update README.md with setup instructions and screenshots | README.md |
| Create backend .env.example with configuration documentation | backend/.env.example |
| Create frontend .env.example with configuration documentation | frontend/.env.example |
| Verify all success criteria (SC-001 through SC-006) pass | - |
| Run quickstart.md validation end-to-end | specs/001-pipboy-ui/quickstart.md |
| Performance audit: verify 60fps animations | - |
| Add JSDoc comments to all public functions | - |

## Summary

| Phase | Tasks | Priority |
|-------|-------|----------|
| Setup | 9 | 1 |
| Foundational | 17 | 1 |
| US1 (MVP) | 12 | 1 |
| US2 | 11 | 2 |
| US3 | 8 | 3 |
| Polish | 7 | 4 |
| **Total** | **64** | |

## MVP Scope

- Setup: 9 tasks
- Foundational: 17 tasks
- US1: 12 tasks
- **Total**: 38 tasks

## Notes

- Tests must be written before implementation (TDD per constitution)
- Each user story is independently testable
- GT executor is the critical shared dependency
