# Full-Stack PR Preview System

On-demand full-stack preview environments for PRs. Reviewers click a link and test the entire LearnCard stack — frontend + all backend services — without checking out code or running anything locally.

## How It Works

```
PR Author/Reviewer                    GitHub Actions                         EC2 Preview Server
─────────────────                    ──────────────                         ──────────────────
                                                                           
Comment "/preview"  ──────────►  Start EC2 instance                        
   or add label                  SSH into EC2            ──────────►  git checkout <branch>
                                                                     docker compose up --build
                                                                     Caddy reverse proxy
                                 Post URL to PR  ◄──────────────────  https://pr-123.preview.learncard.com
                                                                           
Reviewer clicks URL  ─────────────────────────────────────────────►  Caddy routes to services
                                                                           
PR closed/merged     ──────────►  SSH: docker compose down            Containers + volumes removed
                                  Stop EC2 if no previews remain
```

## Usage

### Deploy a Preview

Any of these will trigger a full-stack preview:

| Trigger | How |
|---------|-----|
| **Comment** | Comment `/preview` on the PR |
| **Comment + E2E** | Comment `/preview+e2e` to deploy AND run E2E tests |
| **Label** | Add the `preview` label to the PR |
| **Push** | Push to a PR that already has the `preview` label |
| **Manual** | Run the "Full-Stack PR Preview" workflow with a PR number |

A bot will comment on the PR with the preview URL once it's ready (~5-8 minutes for first build, faster on subsequent deploys due to Docker layer caching).

### Teardown

Previews are automatically torn down when:

- The PR is **closed or merged**
- The `preview` **label is removed**
- The preview is **idle for 4+ hours** (cron job on EC2)

### Preview URL Structure

```
https://pr-<NUMBER>.preview.learncard.com          → Frontend app
https://pr-<NUMBER>.preview.learncard.com/brain/*   → Brain Service (Network API)
https://pr-<NUMBER>.preview.learncard.com/cloud/*   → LearnCloud Service
https://pr-<NUMBER>.preview.learncard.com/lca-api/* → LCA API Service
https://pr-<NUMBER>.preview.learncard.com/preview-health → Health check
```

Caddy strips the path prefix before forwarding to each service, so `/brain/trpc` becomes `/trpc` when it hits the brain service.

## Architecture

### Shared Edge Proxy + Per-PR Stacks

The system uses a **shared Caddy edge proxy** that handles TLS and routes traffic to per-PR Docker Compose stacks:

```
Internet → *.preview.learncard.com (wildcard DNS → EC2 Elastic IP)
    │
    ▼
┌─────────────────────────────────────────────┐
│  Shared Caddy Edge Proxy (preview-caddy)    │
│  Ports 80/443, on "preview-net" network     │
│  Dynamically generated Caddyfile            │
└─────┬──────────────┬──────────────┬─────────┘
      │              │              │
      ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│  pr-123  │  │  pr-456  │  │  pr-789  │
│  stack   │  │  stack   │  │  stack   │
└──────────┘  └──────────┘  └──────────┘
```

Each PR stack is a fully isolated Docker Compose project:

| Service | Image | Port (internal) |
|---------|-------|-----------------|
| **Frontend** (Vite dev server) | `Dockerfile.monorepo` | 3000 |
| **Brain Service** | `Dockerfile.monorepo` | 4000 |
| **Cloud Service** | `Dockerfile.monorepo` | 4100 |
| **Signing Service** | `Dockerfile.monorepo` | 4200 |
| **LCA API** | `lca-api/Dockerfile` | 5100 |
| **Neo4j** | `neo4j:latest` | 7687 |
| **MongoDB** (replica set) | `mongo:latest` | 27017 |
| **Redis** ×3 | `redis:alpine` | 6379 |
| **ElasticMQ** | `softwaremill/elasticmq-native` | 9324 |
| **Postgres** | `postgres` | 5432 |
| **LRS** (xAPI) | `yetanalytics/lrsql:latest` | 8080 |

Each PR stack has its own Docker network (`learn-card`) for internal communication, plus the shared `preview-net` network so the edge Caddy can reach the app/brain/cloud/api containers. Multiple PRs can run concurrently on the same EC2 instance.

### Cost

- **EC2**: One `m5.xlarge` (~$0.19/hr). Auto-stops when no previews are active.
- **At 4 hours/day average**: ~$23/month
- **Docker images**: Cached on the instance across deploys

## One-Time Setup

### 1. EC2 Instance

Provision an EC2 instance (recommended: `m5.xlarge`, 4 vCPU, 16 GB RAM, 100 GB EBS):

```bash
# Bootstrap the instance
ssh ubuntu@<EC2_IP> 'bash -s' < preview/scripts/ec2-bootstrap.sh
```

### 2. DNS

Add a wildcard DNS record:

```
*.preview.learncard.com → <EC2 Elastic IP>
```

Caddy will auto-provision TLS certificates via Let's Encrypt.

### 3. EC2 Start/Stop Lambda

Set up a Lambda function (similar to the existing E2E one) that can start/stop the EC2 instance via HTTP. This keeps the instance off when not in use.

### 4. GitHub Secrets

Add these secrets to the repo (under a `preview` environment):

| Secret | Description |
|--------|-------------|
| `PREVIEW_EC2_LAMBDA_URL` | URL of the Lambda that starts/stops the EC2 |
| `PREVIEW_EC2_USERNAME` | SSH username (e.g., `ubuntu`) |
| `PREVIEW_EC2_SSH_KEY` | SSH private key for the EC2 instance |

> **Tip:** You can reuse the existing E2E EC2 instance and Lambda if capacity allows. Just update the secrets to point to the same instance, or set up a separate one for isolation.

### 5. GitHub Label

Create a `preview` label in the repository (any color — purple is nice).

## Files

```
preview/
├── docker-compose.edge.yaml      # Shared Caddy edge proxy (one instance for all PRs)
├── docker-compose.preview.yaml   # Per-PR full-stack compose (no Caddy, no port bindings)
├── Caddyfile                     # Template/reference (actual config is dynamic-caddyfile)
├── .gitignore                    # Ignores dynamic-caddyfile (generated at runtime)
├── README.md                     # This file
└── scripts/
    ├── ec2-bootstrap.sh          # One-time EC2 setup
    ├── deploy-preview.sh         # Deploy a PR preview
    ├── teardown-preview.sh       # Tear down a PR preview
    ├── regenerate-caddyfile.sh   # Regenerate Caddy routes from active previews
    └── list-previews.sh          # List active previews

.github/workflows/
├── preview.yml                   # Deploy workflow (label/comment/push trigger)
└── preview-teardown.yml          # Teardown workflow (PR close/unlabel trigger)
```

## E2E Tests

Comment `/preview+e2e` to deploy a preview AND run the E2E test suite against it. The tests use the same `@workspace/e2e-tests` package but point at the preview URLs instead of `localhost`. Results are posted as a comment on the PR.

For this to work, the E2E tests need to support configurable service URLs via environment variables:

- `E2E_BRAIN_URL` — Brain service base URL
- `E2E_CLOUD_URL` — Cloud service base URL
- `E2E_LCA_API_URL` — LCA API base URL
- `E2E_MANAGE_DOCKER=false` — Skip Docker Compose management (the preview is already running)

## Troubleshooting

### Preview won't start

1. Check the GitHub Actions workflow run for errors
2. SSH into the EC2 and check Docker logs:
   ```bash
   docker compose -p pr-<NUMBER> -f ~/preview-workspace/LearnCard/preview/docker-compose.preview.yaml logs
   ```

### Preview is slow

The Vite dev server does on-demand compilation. First page load may take a few seconds. For faster previews, you could switch to a production build (change the `app` command in `docker-compose.preview.yaml` to build + serve static files).

### TLS certificate issues

Caddy auto-provisions certs via Let's Encrypt. If you hit rate limits, check:
```bash
docker compose -p pr-<NUMBER> logs caddy
```

### Disk space

Each preview stack uses ~2-5 GB. The cleanup cron job prunes old images, but if space runs low:
```bash
docker system prune -af --volumes
```
