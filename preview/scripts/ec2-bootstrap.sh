#!/usr/bin/env bash
# =============================================================================
# One-time EC2 bootstrap script for the PR preview server
#
# Prerequisites:
#   - Ubuntu 22.04+ EC2 instance (m5.xlarge recommended)
#   - Elastic IP attached
#   - Wildcard DNS record: *.preview.learncard.com → <Elastic IP>
#   - Security group allowing inbound 80, 443, 22
#
# Usage:
#   ssh ubuntu@<EC2_IP> 'bash -s' < preview/scripts/ec2-bootstrap.sh
# =============================================================================
set -euo pipefail

echo "=== LearnCard Preview Server Bootstrap ==="

# --- Docker ---
if ! command -v docker &>/dev/null; then
    echo "Installing Docker..."
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
        sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker "$USER"
    echo "Docker installed. You may need to log out and back in for group changes."
else
    echo "Docker already installed."
fi

# --- Git ---
if ! command -v git &>/dev/null; then
    echo "Installing git..."
    sudo apt-get install -y git
else
    echo "Git already installed."
fi

# --- Workspace directory ---
WORKSPACE_DIR="$HOME/preview-workspace"
mkdir -p "$WORKSPACE_DIR"
echo "Workspace directory: $WORKSPACE_DIR"

# --- Clone repo (if not already present) ---
REPO_DIR="$WORKSPACE_DIR/LearnCard"
if [ ! -d "$REPO_DIR" ]; then
    echo "Cloning LearnCard repository..."
    git clone https://github.com/learningeconomy/LearnCard.git "$REPO_DIR"
else
    echo "Repository already cloned at $REPO_DIR"
fi

# --- Install jq (needed by scripts) ---
if ! command -v jq &>/dev/null; then
    echo "Installing jq..."
    sudo apt-get install -y jq
fi

# --- Idle cleanup cron job ---
# Tears down Docker stacks that have been running for more than 4 hours
CRON_SCRIPT="$WORKSPACE_DIR/cleanup-idle-previews.sh"
cat > "$CRON_SCRIPT" << 'IDLE_EOF'
#!/usr/bin/env bash
# Remove preview stacks idle for more than 4 hours
IDLE_THRESHOLD=$((4 * 3600))
NOW=$(date +%s)
REPO_DIR="$HOME/preview-workspace/LearnCard"
COMPOSE_FILE="$REPO_DIR/preview/docker-compose.preview.yaml"
TORN_DOWN=false

for PROJECT in $(docker compose ls --format json 2>/dev/null | jq -r '.[].Name' | grep '^pr-'); do
    PR_NUM="${PROJECT#pr-}"
    APP_CONTAINER="${PROJECT}-app-1"

    STARTED_AT=$(docker inspect --format='{{.State.StartedAt}}' "$APP_CONTAINER" 2>/dev/null || echo "")
    if [ -z "$STARTED_AT" ]; then
        continue
    fi

    STARTED_EPOCH=$(date -d "$STARTED_AT" +%s 2>/dev/null || echo "0")
    AGE_SECONDS=$((NOW - STARTED_EPOCH))

    if [ "$AGE_SECONDS" -gt "$IDLE_THRESHOLD" ]; then
        echo "Tearing down idle preview: $PROJECT (age ${AGE_SECONDS}s)"
        docker compose -p "$PROJECT" -f "$COMPOSE_FILE" down -v --remove-orphans
        rm -f "$HOME/preview-workspace/preview-${PR_NUM}.env"
        TORN_DOWN=true
    fi
done

# Regenerate Caddyfile if we tore anything down
if [ "$TORN_DOWN" = "true" ]; then
    chmod +x "$REPO_DIR/preview/scripts/regenerate-caddyfile.sh"
    "$REPO_DIR/preview/scripts/regenerate-caddyfile.sh"
fi

# Prune dangling images older than 24h
docker image prune -f --filter "until=24h" > /dev/null 2>&1
IDLE_EOF
chmod +x "$CRON_SCRIPT"

# Add cron job (runs every hour)
CRON_LINE="0 * * * * $CRON_SCRIPT >> $WORKSPACE_DIR/cleanup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "cleanup-idle-previews" ; echo "$CRON_LINE") | crontab -
echo "Idle cleanup cron job installed (hourly)."

echo ""
echo "=== Bootstrap complete ==="
echo ""
echo "Next steps:"
echo "  1. Ensure wildcard DNS: *.preview.learncard.com → $(curl -s ifconfig.me)"
echo "  2. Open ports 80 and 443 in the EC2 security group"
echo "  3. The GitHub Actions workflow will handle the rest"
echo ""
