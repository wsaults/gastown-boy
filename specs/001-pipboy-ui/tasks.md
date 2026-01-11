# Tasks: Pip-Boy UI for Gastown

**Input**: Design documents from `/specs/001-pipboy-ui/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Per constitution principle II (Test-First Development), unit tests are included for services and hooks. Pure UI components are exempt.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Backend tests: `backend/tests/unit/`
- Frontend tests: `frontend/tests/unit/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create monorepo structure with backend/ and frontend/ directories
- [ ] T002 Initialize backend Node.js project with TypeScript in backend/package.json
- [ ] T003 Initialize frontend Vite + React project with TypeScript in frontend/package.json
- [ ] T004 [P] Configure ESLint and Prettier for backend in backend/.eslintrc.js
- [ ] T005 [P] Configure ESLint and Prettier for frontend in frontend/.eslintrc.js
- [ ] T006 [P] Configure TypeScript strict mode for backend in backend/tsconfig.json
- [ ] T007 [P] Configure TypeScript strict mode for frontend in frontend/tsconfig.json
- [ ] T008 [P] Configure Vitest for backend in backend/vitest.config.ts
- [ ] T009 [P] Configure Vitest for frontend in frontend/vitest.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Create shared TypeScript types in backend/src/types/index.ts (Message, GastownStatus, CrewMember, ApiResponse)
- [ ] T011 Create Zod validation schemas in backend/src/types/schemas.ts
- [ ] T012 Implement GT executor service in backend/src/services/gt-executor.ts (spawns gt commands, parses JSON output)
- [ ] T013 Write unit tests for GT executor in backend/tests/unit/gt-executor.test.ts
- [ ] T014 Setup Express app with CORS and JSON middleware in backend/src/index.ts
- [ ] T015 Create API response helpers in backend/src/utils/response.ts
- [ ] T016 Create error handling middleware in backend/src/middleware/error-handler.ts
- [ ] T017 [P] Create frontend TypeScript types in frontend/src/types/index.ts (mirror backend types)
- [ ] T018 [P] Create API client service in frontend/src/services/api.ts
- [ ] T019 [P] Implement usePolling hook in frontend/src/hooks/usePolling.ts
- [ ] T020 Write unit tests for usePolling hook in frontend/tests/unit/usePolling.test.ts
- [ ] T021 [P] Configure Tailwind CSS with Pip-Boy theme in frontend/tailwind.config.ts
- [ ] T022 [P] Create global styles with CRT/scanline effects in frontend/src/styles/globals.css
- [ ] T023 [P] Create Pip-Boy theme tokens in frontend/src/styles/pipboy-theme.ts
- [ ] T024 Create PipBoyFrame layout component in frontend/src/components/shared/PipBoyFrame.tsx
- [ ] T025 Create ScanlineOverlay effect component in frontend/src/components/shared/ScanlineOverlay.tsx
- [ ] T026 Create basic App shell with navigation in frontend/src/App.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Mayor Mail Communication (Priority: P1) 🎯 MVP

**Goal**: Split-view mail interface for viewing and composing messages to the Mayor

**Independent Test**: Send a message to the Mayor and view the response in the split-view interface

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T027 [P] [US1] Write unit tests for mail-service in backend/tests/unit/mail-service.test.ts
- [ ] T028 [P] [US1] Write unit tests for useMail hook in frontend/tests/unit/useMail.test.ts

### Implementation for User Story 1

#### Backend (Mail API)

- [ ] T029 [US1] Implement mail-service with listMail, getMessage, sendMail, markRead in backend/src/services/mail-service.ts
- [ ] T030 [US1] Create mail routes (GET /api/mail, POST /api/mail, GET /api/mail/:id, POST /api/mail/:id/read) in backend/src/routes/mail.ts
- [ ] T031 [US1] Register mail routes in Express app in backend/src/index.ts

#### Frontend (Mail UI)

- [ ] T032 [US1] Implement useMail hook with fetch, send, markRead in frontend/src/hooks/useMail.ts
- [ ] T033 [US1] Create MailList component (message list with selection) in frontend/src/components/mail/MailList.tsx
- [ ] T034 [US1] Create MailDetail component (message content display) in frontend/src/components/mail/MailDetail.tsx
- [ ] T035 [US1] Create ComposeMessage component (subject, body, send/cancel) in frontend/src/components/mail/ComposeMessage.tsx
- [ ] T036 [US1] Create MailView container with split-view layout in frontend/src/components/mail/MailView.tsx
- [ ] T037 [US1] Integrate MailView into App with routing in frontend/src/App.tsx
- [ ] T038 [US1] Add error handling for send failures with draft preservation in frontend/src/components/mail/ComposeMessage.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Gastown Power Controls (Priority: P2)

**Goal**: Power button to start and stop gastown with clear state indication

**Independent Test**: Toggle power button and observe gastown state change within 2 seconds

### Tests for User Story 2

- [ ] T039 [P] [US2] Write unit tests for power-service in backend/tests/unit/power-service.test.ts
- [ ] T040 [P] [US2] Write unit tests for useGastownStatus hook in frontend/tests/unit/useGastownStatus.test.ts

### Implementation for User Story 2

#### Backend (Power API)

- [ ] T041 [US2] Implement power-service with powerUp, powerDown, getStatus in backend/src/services/power-service.ts
- [ ] T042 [US2] Create power routes (POST /api/power/up, POST /api/power/down) in backend/src/routes/power.ts
- [ ] T043 [US2] Create status route (GET /api/status) in backend/src/routes/status.ts
- [ ] T044 [US2] Register power and status routes in Express app in backend/src/index.ts

#### Frontend (Power UI)

- [ ] T045 [US2] Implement useGastownStatus hook with polling in frontend/src/hooks/useGastownStatus.ts
- [ ] T046 [US2] Create PowerButton component with state visualization in frontend/src/components/power/PowerButton.tsx
- [ ] T047 [US2] Add power button animations for state transitions in frontend/src/components/power/PowerButton.tsx
- [ ] T048 [US2] Integrate PowerButton into App layout in frontend/src/App.tsx
- [ ] T049 [US2] Add connection error indicator to PipBoyFrame in frontend/src/components/shared/PipBoyFrame.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Crew Member Stats Dashboard (Priority: P3)

**Goal**: Dashboard showing all crew members with their current status

**Independent Test**: View stats dashboard while gastown is running and verify crew member information updates within 5 seconds

### Tests for User Story 3

- [ ] T050 [P] [US3] Write unit tests for status-service crew member transformation in backend/tests/unit/status-service.test.ts

### Implementation for User Story 3

#### Backend (Agents API)

- [ ] T051 [US3] Implement status-service with getCrewMembers transformation in backend/src/services/status-service.ts
- [ ] T052 [US3] Create agents route (GET /api/agents) in backend/src/routes/status.ts
- [ ] T053 [US3] Register agents route in Express app in backend/src/index.ts

#### Frontend (Crew Stats UI)

- [ ] T054 [US3] Create CrewMemberCard component for individual agent display in frontend/src/components/crew/CrewMemberCard.tsx
- [ ] T055 [US3] Create CrewStats dashboard component in frontend/src/components/crew/CrewStats.tsx
- [ ] T056 [US3] Add offline/empty state handling to CrewStats in frontend/src/components/crew/CrewStats.tsx
- [ ] T057 [US3] Integrate CrewStats into App with navigation tab in frontend/src/App.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T058 [P] Update README.md with setup instructions and screenshots
- [ ] T059 [P] Create backend .env.example with configuration documentation
- [ ] T060 [P] Create frontend .env.example with configuration documentation
- [ ] T061 Verify all success criteria (SC-001 through SC-006) pass
- [ ] T062 Run quickstart.md validation end-to-end
- [ ] T063 Performance audit: verify 60fps animations with React DevTools Profiler
- [ ] T064 Add JSDoc comments to all public functions per constitution principle IV

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Shares status route with US3 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses status-service created in US2

### Within Each User Story

- Tests MUST be written and FAIL before implementation (per constitution)
- Services before routes
- Routes before frontend integration
- Hooks before components
- Components before integration

### Parallel Opportunities

- All Setup tasks T004-T009 can run in parallel after T001-T003
- Foundational tasks T017-T025 can run in parallel after T010-T016
- Once Foundational phase completes, all user stories can start in parallel
- Within each story, backend and frontend can progress in parallel once services are done

---

## Parallel Example: User Story 1

```bash
# Launch tests in parallel:
Task: "Write unit tests for mail-service in backend/tests/unit/mail-service.test.ts"
Task: "Write unit tests for useMail hook in frontend/tests/unit/useMail.test.ts"

# After tests written, implementation can proceed:
# Backend track:
Task: "Implement mail-service..."
Task: "Create mail routes..."

# Frontend track (after useMail tests):
Task: "Implement useMail hook..."
Task: "Create MailList component..."
Task: "Create MailDetail component..."
Task: "Create ComposeMessage component..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Mail)
4. **STOP and VALIDATE**: Test mail functionality independently
5. Deploy/demo if ready - users can send/receive Mayor messages

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Mail) → Test independently → **MVP delivered!**
3. Add User Story 2 (Power) → Test independently → System control added
4. Add User Story 3 (Crew Stats) → Test independently → Full monitoring
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Mail) - highest priority
   - Developer B: User Story 2 (Power) - can start in parallel
   - Developer C: User Story 3 (Crew Stats) - can start in parallel
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Per constitution: Write tests first, ensure they fail, then implement
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- GT executor is the critical shared dependency - test it thoroughly
