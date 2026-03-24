# Federation E2E Tests

This package contains end-to-end tests for the LearnCard brain-service federation features. It spins up two brain-service instances (simulating different deployments like LearnCard app and Scouts app) and tests cross-instance credential exchange.

## Architecture

The test environment consists of:

-   **brain-a**: Brain service instance on port 4000 (e.g., LearnCard app)
-   **brain-b**: Brain service instance on port 4001 (e.g., Scouts app)
-   **Shared infrastructure**: Neo4j, Redis, and ElasticMQ (both instances share the same database)

Each brain service is configured to trust the other via the `TRUSTED_BRAIN_SERVICES` environment variable.

## Prerequisites

-   Docker and Docker Compose
-   Node.js 18+
-   pnpm

## Running Tests

### Start the test environment

```bash
cd tests/federation-e2e
docker compose up -d --build
```

### Run tests

```bash
# Run tests in watch mode
pnpm test:federation:e2e

# Run tests once
pnpm test:federation:run
```

### Stop the test environment

```bash
docker compose down
```

## Test Coverage

### Trust Registry Tests

-   Brain services trust each other via environment whitelist
-   Self-trust verification
-   List trusted services

### DID Resolution Tests

-   DID documents include `UniversalInboxService` service endpoint
-   Cross-instance DID resolution

### Federated Inbox Tests

-   Send credentials from brain-a to brain-b
-   Reject credentials from untrusted services
-   Federated credential delivery with notifications

### External URI Resolution Tests

-   Resolve boosts across instances
-   Handle non-existent resources gracefully

## Configuration

The test environment is configured via `compose.yaml`:

```yaml
environment:
    TRUSTED_BRAIN_SERVICES: 'did:web:localhost%3A4001' # For brain-a
```

## Troubleshooting

### Services not starting

Check Docker logs:

```bash
docker compose logs -f brain-a
docker compose logs -f brain-b
```

### Health checks failing

Ensure ports 4000 and 4001 are available:

```bash
lsof -i :4000
lsof -i :4001
```

### Tests timing out

The global setup waits for both services to be healthy. If tests timeout, check that both brain services started correctly.
