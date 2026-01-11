# Code Style Rules

## TypeScript

- Use TypeScript strict mode (`"strict": true`)
- No `any` types except with explicit justification comment
- Use Zod for runtime validation at API boundaries
- Type assertions (`as`) require a comment explaining why it's safe

## Naming Conventions

- **Files**: kebab-case (`mail-service.ts`, `usePolling.ts`)
- **Components**: PascalCase (`MailList.tsx`, `PowerButton.tsx`)
- **Hooks**: camelCase with `use` prefix (`useMail`, `useGastownStatus`)
- **Types/Interfaces**: PascalCase (`Message`, `GastownStatus`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_BASE_URL`)

## React Patterns

- Functional components only
- Use `React.memo` for expensive renders
- Use `useMemo`/`useCallback` for derived state and callbacks
- Prefer local state; use Context only for truly global state
- Custom hooks for reusable logic

## Imports

- Group imports: React, third-party, local (with blank lines between)
- Use absolute imports from `src/` where configured
- Prefer named exports over default exports

## Error Handling

- Use try/catch in async functions
- Return structured errors from API (`{ success: false, error: { code, message } }`)
- Display user-friendly error messages in UI
- Preserve drafts on send failure

## Comments

- JSDoc for public functions and components
- Inline comments only for non-obvious logic
- No commented-out code in commits
