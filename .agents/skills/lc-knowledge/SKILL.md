---
name: lc-knowledge
description: Use when planning LearnCard work, writing or publishing an implementation plan, recording an architecture decision (ADR), pulling a teammate's plan, or needing internal architecture/Jira context for an LC-#### ticket. Internal engineering knowledge lives in Confluence (space LC), not in this public repo.
---

# LearnCard engineering knowledge

Internal plans, ADRs, architecture notes and standards live in the **LC Confluence space**. Jira owns requirements, status and owners. This public repo holds code only. Never commit internal plans here.

1. Read the canonical runbook before any publish, pull or ADR work. It is maintained in Confluence and overrides anything in this file:

    ```bash
    twg confluence content get "How We Work With Agents" --reference-space LC --detail full --format md --body-only
    ```

2. Follow it exactly. Above all, search before creating, keep the snapshot token, and get human approval before any write.

If `twg` is missing, install it from https://teamwork-graph.atlassian.com/cli/AGENTS.md and have the engineer sign in with their own account. Never handle their token. Without shell access, use the Confluence UI or Atlassian Rovo MCP.
