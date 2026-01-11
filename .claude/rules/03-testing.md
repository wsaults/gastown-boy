# Testing Rules

## Test-First Development (TDD)

Per the project constitution, follow TDD for:
- Backend services (`mail-service`, `power-service`, `status-service`, `gt-executor`)
- Custom React hooks (`useMail`, `useGastownStatus`, `usePolling`)

**Workflow**:
1. Write failing test first
2. Implement minimum code to pass
3. Refactor if needed

## What to Test

### Backend
- Service methods (mock `gt-executor` for unit tests)
- Request/response validation (Zod schemas)
- Error handling paths

### Frontend
- Custom hooks (state changes, API calls)
- Complex component logic (not pure UI styling)

## What NOT to Test

- Pure UI components (styling, layout only)
- Third-party library behavior
- Trivial getters/setters

## Test File Locations

```
backend/tests/unit/*.test.ts
frontend/tests/unit/*.test.ts
```

## Testing Tools

- **Framework**: Vitest
- **React Testing**: @testing-library/react
- **Mocking**: Vitest mocks

## Test Naming

```typescript
describe('MailService', () => {
  it('should return messages sorted by newest first', () => {})
  it('should throw when gt command fails', () => {})
})
```

## Mocking the GT Executor

For service tests, mock the `gt-executor`:

```typescript
vi.mock('../services/gt-executor', () => ({
  executeGt: vi.fn()
}))
```
