# Architecture

## Deployment Architecture <a href="#deployment-architecture" id="deployment-architecture"></a>

LearnCloud Storage is deployed as a serverless application on AWS.

```mermaid
graph TB
    subgraph "AWS Infrastructure"
        api["API Gateway"]
        lambda["Lambda Functions"]
        sg["Security Groups"]
        vpc["Virtual Private Cloud"]

        subgraph "Storage"
            mongodb["MongoDB"]
            redis["Redis Cache"]
        end
    end

    client["Client Applications"] -->|"HTTP/HTTPS"| api
    api -->|"Invokes"| lambda
    lambda -->|"Query/Update"| mongodb
    lambda -->|"Cache"| redis

    lambda -->|"Handle"| xapi["xAPI Statements"]
    lambda -->|"Authenticate"| oidc["OIDC Flows"]
```

## API Endpoints

The LearnCloud Storage API exposes the following endpoints:

| Endpoint                            | Description                 | Handler            |
| ----------------------------------- | --------------------------- | ------------------ |
| `/trpc/*`                           | tRPC API endpoints          | `trpcHandler`      |
| `/api/*`                            | OpenAPI REST endpoints      | `openApiHandler`   |
| `/users/*`                          | DID Web identity resolution | `didWebHandler`    |
| `/xapi/*`                           | xAPI statement handling     | `xApiHandler`      |
| `/oidc/*`                           | OIDC authentication         | `oidcHandler`      |
| `/.well-known/openid-configuration` | OIDC configuration          | `oidcHandler`      |
| `/docs`                             | Swagger UI documentation    | `swaggerUiHandler` |

