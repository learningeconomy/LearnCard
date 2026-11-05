# How to run

## Now (stubs only)

From repo root (after `bun install` on a checkout that has workspace deps):

```bash
bunx nx run hcp:test
# or
bun run --cwd packages/learn-card-hcp test
```

Expected: unit tests pass for five Draft2 `hcp_*` tools and required annotations. No MCP server process; no `@learncard/mcp`.

## After `#1955` merges

1. Depend on `@learncard/mcp` from the HCP (or host) package.
2. Implement the dual-resource mount described in `packages/learn-card-hcp/src/mount-after-1955.stub.ts`.
3. Follow TEST-PLAN §B (H1–H8).
