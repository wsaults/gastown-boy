# Research: Pip-Boy UI for Gastown

**Date**: 2026-01-11
**Feature**: 001-pipboy-ui
**Status**: Complete

## Executive Summary

Gastown is a CLI-first system with no REST API. The `gt` command provides all operations needed for the Pip-Boy UI. The recommended architecture is a lightweight Node.js backend that spawns `gt` commands and streams results to a React frontend.

## Research Questions

### 1. How does gastown expose data to external clients?

**Decision**: CLI-based interface via the `gt` command

**Rationale**:
- Gastown's web package only provides a single HTML dashboard endpoint (`GET /`)
- All operations are designed around CLI commands with `--json` output flags
- The mail, status, and agent systems are deeply integrated with the CLI
- No REST/GraphQL API exists; creating one would require forking gastown

**Alternatives Considered**:
- Direct Go library integration: Rejected - requires Go backend and tight coupling
- Parsing internal JSONL files: Rejected - bypasses gastown's abstractions, brittle
- Forking gastown to add REST API: Rejected - maintenance burden, divergence risk

### 2. How do we communicate with the Mayor?

**Decision**: Use `gt mail send mayor/` and `gt mail inbox --json`

**Rationale**:
- `gt mail send mayor/ -s "Subject" -m "Body"` sends messages to the Mayor
- `gt mail inbox --json` retrieves inbox in JSON format
- Mail supports threading via `--reply-to` and `--thread-id`
- Messages have types (task, notification, reply) and priorities (0-4)

**Key Mail Commands**:
```bash
# Send message to Mayor
gt mail send mayor/ -s "Subject" -m "Message body" --type task

# Get inbox as JSON
gt mail inbox --json

# Get specific thread
gt mail thread <thread-id> --json

# Mark message as read
gt mail mark-read <message-id>
```

### 3. How do we control gastown power state?

**Decision**: Use `gt up`, `gt down`, and `gt status --json`

**Rationale**:
- `gt up` is idempotent - starts all infrastructure agents if not running
- `gt down` gracefully stops infrastructure agents
- `gt status --json` provides current state with agent health info
- States: stopped (no agents), starting (gt up in progress), running (all agents up), stopping (gt down in progress)

**Key Power Commands**:
```bash
# Start gastown
gt up

# Stop gastown (graceful)
gt down

# Get status as JSON
gt status --json

# Watch status continuously
gt status --watch --interval 2
```

### 4. How do we get crew member information?

**Decision**: Use `gt agents list --all --json` and `gt status --json`

**Rationale**:
- `gt agents list` shows all agent types: Mayor, Deacon, Witnesses, Refineries, Crew, Polecats
- `gt status` provides richer info including pinned work, mail counts, stuck states
- Agents are categorized by rig (project) and type

**Key Agent Commands**:
```bash
# List all agents
gt agents list --all

# Get detailed status
gt status --json --verbose

# Check for problems
gt agents check --json
```

### 5. How should the UI receive real-time updates?

**Decision**: Polling with configurable interval (2-5 seconds)

**Rationale**:
- Gastown has no push mechanism (no WebSocket/SSE server)
- `gt status --watch` uses polling internally
- 2-second polling meets SC-003 (power state within 2s)
- 5-second polling meets SC-004 (crew updates within 5s)
- Polling is simple, reliable, and works through tunnels

**Alternatives Considered**:
- WebSockets: Rejected - no gastown server to connect to
- SSE: Rejected - same reason
- File watching: Rejected - complex, platform-specific, doesn't work remotely

## Architecture Decision

### Recommended: Node.js Backend + React Frontend

```
┌─────────────────────────────────────────────────────┐
│                   Browser (React)                    │
│  ┌─────────────┐ ┌─────────────┐ ┌───────────────┐ │
│  │ Mail View   │ │ Power Ctrl  │ │ Crew Stats    │ │
│  └──────┬──────┘ └──────┬──────┘ └───────┬───────┘ │
│         │               │                 │         │
│         └───────────────┼─────────────────┘         │
│                         │ fetch()                   │
└─────────────────────────┼───────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────┐
│         Node.js Backend │ (Express/Fastify)         │
│                         ▼                           │
│  ┌──────────────────────────────────────────────┐  │
│  │           GT Command Executor                 │  │
│  │  • Spawns `gt` child processes               │  │
│  │  • Parses JSON output                        │  │
│  │  • Caches status for performance             │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────┘
                          │ child_process.spawn()
                          ▼
┌─────────────────────────────────────────────────────┐
│                 Gastown CLI (`gt`)                   │
│  • gt mail inbox/send                               │
│  • gt up/down                                       │
│  • gt status                                        │
│  • gt agents list                                   │
└─────────────────────────────────────────────────────┘
```

**Why Node.js Backend**:
1. TypeScript throughout (matches constitution)
2. Simple child_process spawning for `gt` commands
3. Can add caching to reduce `gt` invocations
4. Handles CORS for browser access
5. Works identically via localhost or ngrok tunnel

### API Design (Backend → Frontend)

| Endpoint | Method | Maps to GT Command |
|----------|--------|-------------------|
| `/api/status` | GET | `gt status --json` |
| `/api/mail` | GET | `gt mail inbox --json` |
| `/api/mail` | POST | `gt mail send ...` |
| `/api/mail/:id` | GET | `gt mail read <id> --json` |
| `/api/mail/:id/read` | POST | `gt mail mark-read <id>` |
| `/api/power/up` | POST | `gt up` |
| `/api/power/down` | POST | `gt down` |
| `/api/agents` | GET | `gt agents list --all --json` |

## Data Structures (from Gastown)

### Message (from gt mail)

```typescript
interface Message {
  id: string;           // Beads issue ID format
  from: string;         // e.g., "mayor/", "greenplace/Toast"
  to: string;           // Recipient address
  subject: string;
  body: string;
  timestamp: string;    // ISO 8601
  read: boolean;
  priority: 0 | 1 | 2 | 3 | 4;  // 0=urgent, 4=low
  type: 'notification' | 'task' | 'scavenge' | 'reply';
  threadId: string;
  replyTo?: string;
  pinned: boolean;
  cc?: string[];
}
```

### Status (from gt status)

```typescript
interface GastownStatus {
  town: {
    name: string;
    root: string;
  };
  operator: {
    name: string;
    email: string;
    unreadMail: number;
  };
  agents: {
    mayor: AgentStatus;
    deacon: AgentStatus;
    rigs: Record<string, RigAgents>;
  };
}

interface AgentStatus {
  running: boolean;
  pinnedWork?: string[];
  unreadMail: number;
  state?: 'stuck' | 'awaiting-gate';
}

interface RigAgents {
  witness: AgentStatus;
  refinery: AgentStatus;
  crew: AgentStatus[];
  polecats: AgentStatus[];
}
```

## Open Questions for Implementation

1. **GT Path**: Should we require `gt` in PATH or allow configuration?
   - Recommendation: Check PATH first, fall back to config

2. **Error Handling**: How to surface `gt` command failures?
   - Recommendation: Parse stderr, return structured errors to frontend

3. **Concurrent Commands**: Should we queue or parallelize `gt` calls?
   - Recommendation: Parallelize reads, queue writes (sends, state changes)

## References

- [Gastown Repository](https://github.com/steveyegge/gastown)
- `internal/mail/types.go` - Message structure
- `internal/cmd/mail.go` - Mail CLI commands
- `internal/cmd/status.go` - Status command
- `internal/cmd/up.go` / `down.go` - Power control
- `internal/cmd/agents.go` - Agent listing
