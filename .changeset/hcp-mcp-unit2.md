---
'@learncard/network-brain-service': minor
---

Add HCP Draft 3 §10.3 MCP tools (Unit 2) under `src/hcp/mcp/`: six tools on Streamable HTTP `/mcp`, authorized by Unit 1 grant-bound bearers (no `grantId` in tool args). Reuses `@learncard/mcp` createMcpServer; `hcp_reportSharing` returns not-implemented.
