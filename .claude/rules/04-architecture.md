# Architecture Rules

## Layered Architecture

### Backend Layers

1. **Routes** (`backend/src/routes/`)
   - HTTP request/response handling
   - Input validation (Zod)
   - Call services, return responses

2. **Services** (`backend/src/services/`)
   - Business logic
   - Orchestrate GT commands
   - Transform data for API responses

3. **GT Executor** (`backend/src/services/gt-executor.ts`)
   - Single point for spawning `gt` commands
   - Parse JSON output
   - Handle command errors

### Frontend Layers

1. **Components** (`frontend/src/components/`)
   - UI rendering
   - Event handling
   - Use hooks for data

2. **Hooks** (`frontend/src/hooks/`)
   - State management
   - API calls via api service
   - Polling logic

3. **API Service** (`frontend/src/services/api.ts`)
   - HTTP requests to backend
   - Response typing

## Data Flow

```
User Action → Component → Hook → API Service → Backend Route → Service → GT Executor → gt CLI
                                                                                         ↓
UI Update  ←  Component ←  Hook ←  API Service ←  Backend Route ←  Service ←  JSON output
```

## Key Decisions

1. **CLI Wrapper Pattern**: We spawn `gt` commands instead of integrating with Gastown internals
   - Simpler, loosely coupled
   - Uses Gastown's stable CLI interface
   - Works through tunnels (ngrok)

2. **Stateless UI**: No local storage, fetch from Gastown on demand
   - Gastown is source of truth
   - Avoids sync complexity

3. **Polling for Updates**: No WebSocket/SSE (Gastown doesn't support push)
   - 2-5 second polling intervals
   - Simple and reliable

## Don't Do

- Don't bypass the GT executor to call `gt` directly
- Don't add local caching/storage
- Don't create complex state management (Redux, etc.)
- Don't add authentication (localhost-first design)
