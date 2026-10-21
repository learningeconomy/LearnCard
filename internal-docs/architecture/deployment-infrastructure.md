# Deployment Infrastructure

> Internal ops reference. Moved out of the public Contributing page (docs/development/contributing.md) in the 2026 docs migration.

LearnCard backend services are deployed as serverless applications on AWS, primarily using Lambda functions, API Gateway, and various supporting services.

```mermaid
flowchart TD
    subgraph "AWS Cloud"
        subgraph "API Gateway"
            httpapi["HTTP API"]
        end

        subgraph "Lambda Functions"
            trpc["tRPC Lambda"]
            api["OpenAPI Lambda"]
            didweb["DID Web Lambda"]
            swagger["Swagger UI Lambda"]
            notif["Notifications Worker"]
        end

        subgraph "Database & Cache"
            neo4j["Neo4j Database"]
            redis["Redis Cache Cluster"]
            sqs["SQS Notifications Queue"]
        end

        subgraph "Networking"
            vpc["VPC"]
            subgraph "Subnets"
                public["Public Subnet"]
                private["Private Subnet"]
            end
            natgw["NAT Gateway"]
            igw["Internet Gateway"]
        end
    end

    httpapi -->|"/trpc/{trpc+}"| trpc
    httpapi -->|"/api/{trpc+}"| api
    httpapi -->|"/users/{params+}"| didweb
    httpapi -->|"/docs"| swagger

    trpc --> neo4j
    trpc --> redis
    trpc --> sqs

    sqs --> notif

    vpc --> public
    vpc --> private
    vpc --> igw
    public --> natgw

    trpc -->|"Runs in"| private
    api -->|"Runs in"| private
    didweb -->|"Runs in"| private
    redis -->|"Runs in"| private
```

### Serverless Configuration <a href="#serverless-configuration" id="serverless-configuration"></a>

The services are configured using the Serverless Framework, which manages the AWS resources. Key features:

- **Functions**: Multiple Lambda functions serve different endpoints
- **VPC Configuration**: Services run in a private subnet with NAT gateway access
- **ElastiCache**: Redis cache for improved performance
- **Security Groups**: Control network access between components

### Environment Variables <a href="#environment-variables" id="environment-variables"></a>

The deployment process uses numerous environment variables to configure the services securely. These include:

| Category      | Variables                                       | Purpose                       |
| ------------- | ----------------------------------------------- | ----------------------------- |
| AWS Access    | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`    | AWS authentication            |
| Database      | `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` | Neo4j database access         |
| Redis         | `REDIS_HOST`, `REDIS_PORT`                      | Redis cache configuration     |
| Cryptographic | `SEED`, `LEARN_CLOUD_SEED`, `JWT_SIGNING_KEY`   | Secure key material           |
| Monitoring    | `SENTRY_DSN`, `DD_API_KEY`                      | Error tracking and monitoring |

### Docker Images <a href="#docker-images" id="docker-images"></a>

LearnCard services are also published as Docker images to Docker Hub, making them easier to deploy in containerized environments.

#### Docker Release Process <a href="#docker-release-process" id="docker-release-process"></a>

```mermaid
sequenceDiagram
    participant PR as "Changeset Release PR"
    participant GitHub as "GitHub Actions"
    participant DockerHub as "Docker Hub"

    PR->>GitHub: Merge to main
    GitHub->>GitHub: Check if PR is changeset release
    GitHub->>GitHub: Extract package versions
    GitHub->>GitHub: Build LearnCloud Network API image
    GitHub->>DockerHub: Push LearnCloud Network API image
    GitHub->>GitHub: Build LearnCloud Storage API image
    GitHub->>DockerHub: Push LearnCloud Storage API image
```

The Docker release process:

1. Triggered when a Changeset release PR is merged to main
2. Extracts version information from package.json files
3. Builds Docker images for Brain Service and LearnCloud Service
4. Tags images with semantic version numbers
5. Pushes images to Docker Hub

Available images:

- `welibrary/lcn-brain-service`: LearnCloud Network API container
- `welibrary/lcn-cloud-service`: LearnCloud Storage API container

### Maintenance <a href="#maintenance" id="maintenance"></a>

The repository includes a "Maid Service" workflow that automatically cleans up the codebase when necessary. This workflow:

1. Runs after pushes to the main branch
2. Checks for unintended file changes that weren't committed
3. Creates an automated PR to clean up the worktree if necessary

This helps maintain a clean repository state, especially when automation scripts modify files.
