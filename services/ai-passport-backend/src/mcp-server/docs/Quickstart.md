# LearnCard MCP Server

[Watch this video to see how to test the MCP server](https://www.loom.com/share/7c16c7e8972d439782fe68791194a811)

[How to test the get_user_context and save_session tools specfically](https://www.loom.com/share/ffa64bc4cbf54ed1a3fd258594a93d8f)

## What is this?

The MCP (Model Context Protocol) server provides Claude Code and other AI assistants with access to user learning context stored in AI Passport.

MCP tools are functions that AI assistants can call to retrieve information or perform actions. This server provides three tools:

- **`get_user_context`**: Returns a summary of a user's learning journey based on their DID
- **`get_answer_about_user`**: Answers questions about a user using semantic search over their credentials
- **`save_session_summary`**: Saves a learning session summary and issues verifiable credentials

## Running the Server

From `services/ai-passport-backend`:

```bash
docker compose up
```

This starts both the backend and MCP server. The MCP server runs on **port 3000** and is accessible at `http://localhost:3000/`.

## How It Works

- **`get_user_context`**: Fetches or generates an AI Insight credential for the user
- **`get_answer_about_user`**: Uses Qdrant semantic search to find relevant credentials and synthesizes an answer with an LLM
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

Claude will use the `get_user_context` tool to fetch the AI Insight summary from the MCP server.
