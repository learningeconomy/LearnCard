# `@learncard/hcp`

LC-2320 placement spike: **Draft2 §10** MCP binding **stubs** for Human Context Protocol.

- Annotated tools: `hcp_queryContext`, `hcp_getEntry`, `hcp_createEntry`, `hcp_reviseEntry`, `hcp_withdrawEntry`
- Local annotation helper mirrors `@learncard/mcp` `defineMcpTool` shape **without** depending on that package
- Dual-resource `createMcpApp` mount waits on [#1955](https://github.com/learningeconomy/LearnCard/pull/1955) — see `src/mount-after-1955.stub.ts`

Working Recognition MCP is **out of scope** for this cut (deferred follow-on).

Docs: `docs/prototypes/lc-2320-hcp-placement/`.
