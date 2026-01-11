# Implementation Plan: Pip-Boy UI for Gastown

**Branch**: `001-pipboy-ui` | **Date**: 2026-01-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-pipboy-ui/spec.md`

## Summary

Build a Fallout Pip-Boy themed web UI for interacting with gastown, featuring a split-view mail interface for Mayor communication, power button for starting/stopping gastown, and a crew member stats dashboard. The UI will be a React frontend with a Node.js backend that wraps gastown CLI commands.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode per constitution)
**Primary Dependencies**: React 18+, Tailwind CSS, Vite, Express.js, Zod
**Storage**: N/A (stateless UI; gastown handles persistence)
**Testing**: Vitest for unit tests
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: 60fps animations, <200ms UI response time
**Constraints**: Must work via localhost and ngrok tunnels
**Scale/Scope**: Single user, local development tool

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety First | ✅ Pass | TypeScript strict mode; Zod for API boundary validation |
| II. Test-First Development | ✅ Pass | Unit tests for services/hooks; pure UI components exempt |
| III. UI Performance | ✅ Pass | 60fps target; React.memo, useMemo for expensive renders |
| IV. Documentation | ✅ Pass | JSDoc on public functions; README with setup instructions |
| V. Simplicity | ✅ Pass | CLI wrapper pattern avoids complex gastown integration |

**Gate Result**: PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-pipboy-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output (complete)
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── routes/          # Express route handlers
│   │   ├── mail.ts
│   │   ├── power.ts
│   │   └── status.ts
│   ├── services/        # GT command wrappers
│   │   ├── gt-executor.ts
│   │   ├── mail-service.ts
│   │   ├── power-service.ts
│   │   └── status-service.ts
│   ├── types/           # Shared TypeScript types
│   │   └── index.ts
│   └── index.ts         # Express app entry
├── tests/
│   └── unit/
└── package.json

frontend/
├── src/
│   ├── components/      # React components
│   │   ├── mail/
│   │   │   ├── MailList.tsx
│   │   │   ├── MailDetail.tsx
│   │   │   └── ComposeMessage.tsx
│   │   ├── power/
│   │   │   └── PowerButton.tsx
│   │   ├── crew/
│   │   │   └── CrewStats.tsx
│   │   └── shared/
│   │       ├── PipBoyFrame.tsx
│   │       └── ScanlineOverlay.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useGastownStatus.ts
│   │   ├── useMail.ts
│   │   └── usePolling.ts
│   ├── services/        # API client
│   │   └── api.ts
│   ├── types/           # Frontend types
│   │   └── index.ts
│   ├── styles/          # Tailwind config + theme
│   │   ├── pipboy-theme.ts
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   └── unit/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

**Structure Decision**: Web application with separate frontend and backend. The backend wraps gastown CLI commands; the frontend provides the Pip-Boy themed interface. This separation allows the frontend to be served statically while the backend handles CLI execution.

## Complexity Tracking

> No constitution violations requiring justification.

| Decision | Rationale | Simpler Alternative |
|----------|-----------|---------------------|
| Separate backend | Required to execute `gt` CLI commands | N/A - browser cannot spawn processes |
| Polling for updates | Gastown has no push mechanism | N/A - only option available |
