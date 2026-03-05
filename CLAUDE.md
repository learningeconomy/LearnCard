# LearnCard SDK

## Tooling

- When vexp MCP is available, prefer `run_pipeline` for complex cross-cutting searches (impact analysis, multi-file refactors)
- For simple lookups (specific file, function, grep for a pattern), use built-in tools (Grep, Glob, Read) directly — they're faster and more reliable
- vexp is optional — if it errors or is unavailable, fall back to built-in tools

## Build & Test Commands

- Build project: `pnpm build` or `pnpm exec nx build <package-name>`
- Test all packages: `pnpm test` or `pnpm exec nx test`
- Run tests once (non-watch): `pnpm test -- run` (equivalent to `vitest run`)
- Run single test: `pnpm exec nx test <package-name> --testFile=path/to/test.spec.ts`
- Run e2e tests: `pnpm exec nx test:e2e e2e`

## Code Style Guidelines

- **TypeScript**: Strict typing with interfaces in dedicated type files
- **Imports**: Prefer named imports; avoid default exports when possible
- **Formatting**: Follow Prettier config; 4-space indentation for JSX
- **Naming**: PascalCase for classes/interfaces/types/components, camelCase for variables/functions/methods, ALL_CAPS for constants
- **Error handling**: Use try/catch with specific error types
- **Functions**: Prefer arrow functions with explicit return types
- **React**: Function components with hooks preferred over class components
- **Modules**: Keep files focused on single responsibility
- **Documentation**: Add JSDoc comments for public APIs and complex logic

## Monorepo Structure

pnpm workspaces + NX. Packages in `packages/`, services in `services/`, apps in `apps/`, e2e tests in `tests/`.

## Documentation (`docs/`)

GitBook docs synced to docs.learncard.com. Diataxis framework: tutorials in `docs/tutorials/`, how-to guides in `docs/how-to-guides/`, reference in `docs/sdks/`, concepts in `docs/core-concepts/`.

Key editing rules:
- GitBook-flavored markdown (`{% tabs %}`, `{% hint %}`, `{% content-ref %}`)
- Use `@learncard/init` for initialization (not `@learncard/core`)
- API patterns: `learnCard.invoke.*` for methods, `learnCard.id.did()` for DID access
- Internal links use relative paths

## Architecture Reference

For detailed architecture, read the relevant AGENTS.md when working in that area:

| Area | File | What's there |
|------|------|-------------|
| Plugin system, network routes, credential storage | `AGENTS.md` (root) | Plugin architecture, adding routes, 3-layer storage model |
| Brain service (Neo4j, tRPC, ConsentFlow, revocation) | `services/learn-card-network/brain-service/AGENTS.md` | Neo4j data model, tRPC routes, ConsentFlow, signing authorities, revocation, tracing |
| Partner Connect SDK | `packages/learn-card-partner-connect-sdk/AGENTS.md` | Security model, message lifecycle, adding methods |
| App Store examples | `examples/app-store-apps/AGENTS.md` | Example app patterns, Astro + Partner Connect stack |
| ScoutPass app | `apps/scouts/AGENTS.md` | Troop/Scout hierarchy, credential status, key components |
| LearnCard app (E2E testing, architecture) | `apps/learn-card-app/AGENTS.md` | Playwright E2E test setup, auth, Ionic modal gotchas, credential flows |

## Quick Reference — Common Patterns

```typescript
// Network plugin methods (tRPC client under the hood)
learnCard.invoke.createProfile(...)
learnCard.invoke.acceptCredential(uri)
learnCard.invoke.getRevokedCredentials()

// Control planes
learnCard.read.get(uri)                          // Resolve credential content
learnCard.index.LearnCloud.get({ category })     // Personal wallet index (MongoDB)
learnCard.index.LearnCloud.add(record)           // Add to personal index
learnCard.store.LearnCloud.uploadEncrypted(vc)   // Store credential

// Key locations
// Types:          packages/learn-card-types/src/lcn.ts
// Brain routes:   services/learn-card-network/brain-service/src/routes/
// Network plugin: packages/plugins/learn-card-network/src/plugin.ts
// React Query:    packages/learn-card-base/src/react-query/
```
