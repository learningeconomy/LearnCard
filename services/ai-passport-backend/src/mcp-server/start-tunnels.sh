#!/bin/bash

set -e

echo "🚀 Starting Cloudflare Tunnels for Backend and MCP Server..."
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared is not installed."
    echo "Install it with: brew install cloudflare/cloudflare/cloudflared"
    exit 1
fi

# Quick tunnels don't work if config.yaml exists - temporarily rename it
CONFIG_RENAMED=false
if [ -f ~/.cloudflared/config.yml ] || [ -f ~/.cloudflared/config.yaml ]; then
    echo "⚠️  Found config file in ~/.cloudflared - temporarily renaming for quick tunnel..."
    [ -f ~/.cloudflared/config.yml ] && mv ~/.cloudflared/config.yml ~/.cloudflared/config.yml.backup
    [ -f ~/.cloudflared/config.yaml ] && mv ~/.cloudflared/config.yaml ~/.cloudflared/config.yaml.backup
    CONFIG_RENAMED=true
fi

# Check if docker compose is running
if ! docker compose ps | grep -q "Up"; then
    echo "⚠️  Docker compose doesn't appear to be running"
    echo "   Starting docker compose..."
    docker compose up -d
    echo "   Waiting for services to start..."
    sleep 5
fi

# Check if backend is running on port 3001
if ! lsof -i :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Backend not detected on port 3001"
    echo "   Please make sure docker compose is running"
    exit 1
fi

# Check if MCP server is running on port 3000
if ! lsof -i :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ MCP server not detected on port 3000"
    echo "   Please make sure docker compose is running"
    exit 1
fi

echo "✅ Both servers detected"
echo ""

# Create temporary files for tunnel URLs
BACKEND_TUNNEL_FILE=$(mktemp)
MCP_TUNNEL_FILE=$(mktemp)

# Start backend tunnel in background
echo "🌐 Starting tunnel for Backend (port 3001)..."
cloudflared tunnel --url http://localhost:3001 2>&1 | tee "$BACKEND_TUNNEL_FILE" &
BACKEND_PID=$!

# Start MCP server tunnel in background
echo "🌐 Starting tunnel for MCP Server (port 3000)..."
cloudflared tunnel --url http://localhost:3000 2>&1 | tee "$MCP_TUNNEL_FILE" &
MCP_PID=$!

# Wait for tunnels to establish
echo "⏳ Waiting for tunnels to establish..."
sleep 5

# Extract URLs from cloudflared output
BACKEND_URL=""
MCP_URL=""

# Try to extract backend URL
for i in {1..10}; do
    if grep -q "https://" "$BACKEND_TUNNEL_FILE"; then
        BACKEND_URL=$(grep -o "https://[a-z0-9-]*\.trycloudflare\.com" "$BACKEND_TUNNEL_FILE" | head -1)
        break
    fi
    sleep 1
done

# Try to extract MCP URL
for i in {1..10}; do
    if grep -q "https://" "$MCP_TUNNEL_FILE"; then
        MCP_URL=$(grep -o "https://[a-z0-9-]*\.trycloudflare\.com" "$MCP_TUNNEL_FILE" | head -1)
        break
    fi
    sleep 1
done

# Check if URLs were found
if [ -z "$BACKEND_URL" ] || [ -z "$MCP_URL" ]; then
    echo "❌ Failed to extract tunnel URLs"
    echo "Backend tunnel output:"
    cat "$BACKEND_TUNNEL_FILE"
    echo ""
    echo "MCP tunnel output:"
    cat "$MCP_TUNNEL_FILE"
    kill $BACKEND_PID $MCP_PID 2>/dev/null
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Tunnels established successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Backend URL:    $BACKEND_URL"
echo "📋 MCP Server URL: $MCP_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  NEXT STEPS - Update environment variables and restart servers:"
echo ""
echo "1. In a NEW terminal, update services/ai-passport-backend/.env with these values:"
echo "   DOMAIN=$BACKEND_URL"
echo "   MCP_SERVER_URL=$MCP_URL"
echo ""
echo "2. Restart Docker Compose to apply the new URLs:"
echo "   cd services/ai-passport-backend"
echo "   docker compose down"
echo "   docker compose up -d"
echo ""
echo "3. Your tunnels will remain running in THIS terminal."
echo ""
echo "4. Use the MCP Server URL to connect your AI client:"
echo "   $MCP_URL"
echo ""
echo "⚠️  IMPORTANT: These URLs change every time you restart the tunnels"
echo ""
echo "Press Ctrl+C to stop the tunnels"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down tunnels..."
    kill $BACKEND_PID $MCP_PID 2>/dev/null
    rm -f "$BACKEND_TUNNEL_FILE" "$MCP_TUNNEL_FILE"

    # Restore config file if we renamed it
    if [ "$CONFIG_RENAMED" = true ]; then
        echo "🔄 Restoring cloudflared config..."
        [ -f ~/.cloudflared/config.yml.backup ] && mv ~/.cloudflared/config.yml.backup ~/.cloudflared/config.yml
        [ -f ~/.cloudflared/config.yaml.backup ] && mv ~/.cloudflared/config.yaml.backup ~/.cloudflared/config.yaml
    fi

    exit 0
}

trap cleanup EXIT INT TERM

# Keep script running and show logs
tail -f "$BACKEND_TUNNEL_FILE" "$MCP_TUNNEL_FILE" &
wait
