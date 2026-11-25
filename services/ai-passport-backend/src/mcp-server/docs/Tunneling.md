# Tunneling with Cloudflare

[Walkthrough Video](https://www.loom.com/share/77cda1f371084378bfc54e4909b69a8d)

## What is this?

Exposes your local MCP server over HTTPS using Cloudflare Tunnels, enabling OAuth authentication with external AI clients like Claude Desktop.

## Prerequisites

- Docker running: `docker compose up -d` from `services/ai-passport-backend`
- Homebrew installed (macOS)

## Running the Tunnel

From `services/ai-passport-backend`:

1. **Install cloudflared:**

```bash
brew install cloudflare/cloudflare/cloudflared
```

2. **Run the tunnel script:**

```bash
bun run dev:tunnel
```

The script will display tunnel URLs:

```
Backend URL:    https://august-component-dad-rail.trycloudflare.com
MCP Server URL: https://definition-warm-weight-conduct.trycloudflare.com
```

3. **Update `.env` with your tunnel URLs:**

```bash
DOMAIN=https://your-backend-tunnel.trycloudflare.com
MCP_SERVER_URL=https://your-mcp-tunnel.trycloudflare.com
```

4. **Restart Docker to apply changes:**

```bash
docker compose down && docker compose up -d
```

## Important Notes

- **URLs change on every restart** - you must update `.env` each time
- **Keep the tunnel terminal open** - closing it stops the tunnels
- **Development/testing only** - quick tunnels are not for production

## Using the Tunnel

Use the **MCP Server URL** when connecting AI clients (e.g. Claude Desktop) to access your authenticated MCP server.
