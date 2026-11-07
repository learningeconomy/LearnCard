# LearnCard MCP Server

[Watch this video to see how to test the MCP server](https://www.loom.com/share/7c16c7e8972d439782fe68791194a811)

[How to test the get_user_context and save_session tools specfically](https://www.loom.com/share/ffa64bc4cbf54ed1a3fd258594a93d8f)

## What is this?

The MCP (Model Context Protocol) server provides Claude Code and other AI assistants with access to user learning context stored in AI Passport.

MCP tools are functions that AI assistants can call to retrieve information or perform actions. This server provides three tools:

- **`get_user_context`**: Returns a summary of a user's learning journey based on their DID
- **`get_answer_about_user`**: Answers questions using the current learner context and relevant credential details
- **`save_session_summary`**: Saves a learning session summary and issues verifiable credentials

## Running the Server

From `services/ai-passport-backend`:

```bash
docker compose up
```

This starts both the backend and MCP server. The MCP server runs on **port 3000** and is accessible at `http://localhost:3000/`.

## How It Works

- **`get_user_context`**: Verifies all currently consented credential sources and synthesizes a consent-scoped learner context
- **`get_answer_about_user`**: Includes the same learner context, adds Qdrant-ranked credential details, and synthesizes an answer with an LLM
- **`save_session_summary`**: Generates structured learning outcomes, issues topic and summary credentials, and returns a LearnCard link

## Connecting with Claude Code

Install Claude Code: https://www.claude.com/product/claude-code

Add the MCP server to Claude Code:

```bash
claude mcp add --transport http learncard-mcp http://localhost:3000/
```

Then, you need to authenticate with your LearnCard account.

Then in Claude Code, you can ask questions yourself.

```
What does my learning profile look like?
```

Claude will use the `get_user_context` tool to fetch the current learner context from the MCP server.

## Diagnose missing credential vectors

In a local debug session, call the read-only helper with the authenticated owner's DID:

```typescript
import { runWithAiPrivacyContext } from './src/ai/privacy';
import { withOwnerOperation } from './src/services/dataErasure';
import { diagnoseConsentedCredentialVectors } from './src/services/consentedCredentialVectorDiagnostics';

const report = await runWithAiPrivacyContext(did, () =>
    withOwnerOperation(did, () => diagnoseConsentedCredentialVectors(did))
);
```

`missingUris` lists consented credentials with no points in the effective read generation.
`partialUris` lists credentials with points in fewer than all five credential collections.
`indexedUris` lists credentials present in all five. The report includes the pinned generation and consent revision.

Presence does not prove search eligibility: stale provenance, failed verification, or low relevance can still exclude an indexed credential.
Keep the report private. It contains credential URIs, does not repair embeddings, and is not a new MCP tool or model input.
