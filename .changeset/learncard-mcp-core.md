---
'@learncard/mcp': minor
---

Add `@learncard/mcp`, the shared MCP server core extracted from the AI Passport backend: Express + StreamableHTTP bootstrap, OAuth 2.1 proxy provider factory, tool registration that requires behavior annotations, optional skills serving, and typed error responses.

Preserve verifier service failures as 500 responses and scope failures as 403. Hosts explicitly reject invalid tokens with `InvalidTokenError` (401). Emit a content-free event for verifier service failures.

Publish this MIT-licensed package publicly on npm. Sanitize unknown tool-handler failures as generic `internal_error` results, preserve intended `McpToolError` messages, and emit only content-free diagnostics.
