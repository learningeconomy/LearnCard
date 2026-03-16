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
                                 Post URL to PR  ◄──────────────────  https://pr-123.preview.learncard.ai
                                                                           
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
https://pr-<NUMBER>.preview.learncard.ai          → Frontend app
https://pr-<NUMBER>.preview.learncard.ai/brain/*   → Brain Service (Network API)
https://pr-<NUMBER>.preview.learncard.ai/cloud/*   → LearnCloud Service
https://pr-<NUMBER>.preview.learncard.ai/lca-api/* → LCA API Service
https://pr-<NUMBER>.preview.learncard.ai/preview-health → Health check
https://logs.preview.learncard.ai                  → Dozzle log viewer (all PRs)
```

Caddy strips the path prefix before forwarding to each service, so `/brain/trpc` becomes `/trpc` when it hits the brain service.

## Architecture

### Shared Edge Proxy + Per-PR Stacks

The system uses a **shared Caddy edge proxy** that handles TLS and routes traffic to per-PR Docker Compose stacks:

```
Internet → *.preview.learncard.ai (wildcard DNS → EC2 Elastic IP)
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

All AWS infrastructure is managed via Terraform in `preview/infra/`.

### 1. Provision Infrastructure with Terraform

```bash
cd preview/infra

# Generate an SSH key pair for the EC2 instance
ssh-keygen -t ed25519 -f preview-server -N ""

# Generate an API key for Lambda authentication
API_KEY=$(openssl rand -hex 32)
echo "Save this API key for GitHub secrets: $API_KEY"

# Configure Terraform variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values:
#   - ssh_public_key: paste contents of preview-server.pub
#   - api_key: paste the generated API key
#   - route53_zone_id: your Route53 hosted zone ID

# Deploy
terraform init
terraform plan
terraform apply
```

Terraform provisions: EC2 + Elastic IP, security group, wildcard DNS, Lambda (start/stop/status), and IAM roles.

### 2. Bootstrap the EC2

After `terraform apply`, run the one-time bootstrap script:

```bash
EC2_IP=$(terraform output -raw ec2_public_ip)
ssh -i preview-server "ubuntu@${EC2_IP}" 'bash -s' < ../scripts/ec2-bootstrap.sh
```

This installs Docker, git, jq, clones the repo, and sets up the idle cleanup cron.

### 3. GitHub Configuration

**Create a `preview` environment** in repo Settings → Environments.

**Add these secrets** to the `preview` environment:

| Secret | Value | How to Get |
|--------|-------|------------|
| `PREVIEW_EC2_LAMBDA_URL` | Lambda Function URL | `terraform output -raw lambda_function_url` |
| `PREVIEW_EC2_USERNAME` | `ubuntu` | Default for Ubuntu AMI |
| `PREVIEW_EC2_SSH_KEY` | SSH private key | Contents of `preview-server` file |
| `PREVIEW_EC2_API_KEY` | API key | The key you generated in step 1 |
| `DOZZLE_USERNAME` | Log viewer username | Choose any username |
| `DOZZLE_PASSWORD` | Log viewer password | Choose a shared team password |

**Create a `preview` label** in the repository (any color).

> **Tip:** Run `terraform output github_secrets_summary` for a quick reference of all required values.

## Files

```
preview/
├── docker-compose.edge.yaml      # Shared Caddy edge proxy (one instance for all PRs)
├── docker-compose.preview.yaml   # Per-PR full-stack compose (no Caddy, no port bindings)
├── Caddyfile                     # Template/reference (actual config is dynamic-caddyfile)
├── .gitignore                    # Ignores dynamic-caddyfile (generated at runtime)
├── README.md                     # This file
├── infra/                        # Terraform IaC for AWS resources
│   ├── main.tf                   # EC2, security group, EIP, Route53, Lambda, IAM
│   ├── variables.tf              # Input variables
│   ├── outputs.tf                # Outputs (Lambda URL, EC2 IP, GitHub secrets summary)
│   ├── terraform.tfvars.example  # Example variable values
│   └── lambda/
│       └── index.mjs             # Lambda handler (start/stop/status with API key auth)
└── scripts/
    ├── ec2-bootstrap.sh          # One-time EC2 setup
    ├── cleanup-idle-previews.sh  # Hourly cron: tear down idle stacks, auto-stop EC2
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

### Log Viewer

Dozzle provides a web-based Docker log viewer at `https://logs.preview.learncard.ai`. It shows live logs from all `pr-*` containers and is protected by simple username/password auth (configured via `DOZZLE_USERNAME` and `DOZZLE_PASSWORD` GitHub secrets). The link is included in the PR comment after a successful deploy.

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
