# Plan: Convoys Tab

We will add a "CONVOYS" tab to the Gastown Boy UI to monitor active convoys, mirroring the functionality of `gt dashboard`.

## Goals
- Display a list of active convoys.
- Show progress (completed/total) for each convoy.
- Show detailed status of tracked issues within each convoy.
- Auto-refresh data.

## Architecture

### Backend
1.  **Types**: Define `Convoy` and `TrackedIssue` interfaces.
2.  **Service**: `ConvoysService` to fetch data from `bd`.
    -   `listConvoys()`:
        -   Fetch open convoys: `bd list --type=convoy --status=open`.
        -   Fetch details for each convoy to get dependencies: `bd show <convoy_ids>`.
        -   Filter dependencies for `type="tracks"`.
        -   Fetch details for all tracked issues: `bd show <tracked_ids>`.
        -   Calculate progress and status.
        -   (Optional) Attempt to map to active agents for "live" status (like `gt dashboard` does), but MVP can rely on static issue data.
3.  **API**: `GET /api/convoys`.

### Frontend
1.  **API Client**: Add `convoys.list()` to `api.ts`.
2.  **Components**:
    -   `ConvoysView`: Main container (like `MailView`).
    -   `ConvoyList`: List of `ConvoyCard`s.
    -   `ConvoyCard`: Display convoy details, progress bar, and list of tracked issues (expandable?).
3.  **App**: Add "CONVOYS" tab to navigation.

## Tasks

### Backend
- [ ] Create `backend/src/types/convoys.ts`.
- [ ] Create `backend/src/services/convoys-service.ts`.
- [ ] Create `backend/src/routes/convoys.ts`.
- [ ] Register route in `backend/src/index.ts`.

### Frontend
- [ ] Create `frontend/src/types/convoys.ts`.
- [ ] Update `frontend/src/services/api.ts`.
- [ ] Create `frontend/src/components/convoys/ConvoyCard.tsx`.
- [ ] Create `frontend/src/components/convoys/ConvoyList.tsx`.
- [ ] Create `frontend/src/components/convoys/index.ts`.
- [ ] Update `frontend/src/App.tsx` to include the tab.

## Data Model

```typescript
// Shared Type
interface TrackedIssue {
  id: string;
  title: string;
  status: string; // "open", "closed", etc.
  assignee?: string;
}

interface Convoy {
  id: string;
  title: string;
  status: string;
  progress: {
    completed: number;
    total: number;
  };
  trackedIssues: TrackedIssue[];
}
```
