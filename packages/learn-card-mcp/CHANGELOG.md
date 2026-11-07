# @learncard/mcp

## 0.1.0

### Minor Changes

- [#1955](https://github.com/learningeconomy/LearnCard/pull/1955) [`d0f7ac450c1b392e7b4c6a62304635a641a14161`](https://github.com/learningeconomy/LearnCard/commit/d0f7ac450c1b392e7b4c6a62304635a641a14161) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add `@learncard/mcp`, the shared MCP server core extracted from the AI Passport backend: Express + StreamableHTTP bootstrap, OAuth 2.1 proxy provider factory, tool registration that requires behavior annotations, optional skills serving, and typed error responses.

    Preserve verifier service failures as 500 responses and scope failures as 403. Hosts explicitly reject invalid tokens with `InvalidTokenError` (401). Emit a content-free event for verifier service failures.

    Publish this MIT-licensed package publicly on npm. Sanitize unknown tool-handler failures as generic `internal_error` results, preserve intended `McpToolError` messages, and emit only content-free diagnostics.

    Preserve authentication and cancellation context when a tool omits `inputSchema`, keeping request context out of handler arguments.

    Export the middleware SDK's OAuth error classes and use them in the AI Passport host so separate SDK copies do not turn intended 401 or 403 responses into 500s.
