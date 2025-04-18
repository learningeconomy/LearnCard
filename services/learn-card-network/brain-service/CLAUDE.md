# LearnCard Network Brain Service

## Build & Development Commands

-   Build: `pnpm build` or `pnpm build:docker`
-   Dev: `pnpm dev` - Watches files and rebuilds
-   Start server: `pnpm start` - Runs local server on port 3000
-   Start on port 4000: `pnpm start-p-4000`
-   Deploy: `pnpm serverless-deploy`

## Test Commands

-   Run all tests: `pnpm test`
-   Watch mode: `pnpm test:watch`
-   Run single test: `pnpm test test/consentflow.spec.ts`
-   Run specific test: `pnpm test -t "should allow setting and retrieving the image field for a contract"`

## Code Style Guidelines

-   **TypeScript**: Strict typing with interfaces/types defined in `src/types/`
-   **Imports**: Use path aliases (`@helpers/*`, `@models`, `@routes`, etc.)
-   **Error Handling**: Use trpc error codes (`UNAUTHORIZED`, `BAD_REQUEST`, etc.)
-   **Naming**:
    -   PascalCase for classes, types, interfaces
    -   camelCase for variables, functions, methods
-   **Models Structure**: Database models in `src/models/` with relationships defined
-   **Access Layer**: Database operations go in `src/accesslayer/` folders
-   **Routes**: API endpoints defined in `src/routes/` using tRPC
-   **Variable Exports**: Avoid one-line default exports; use named exports
-   **Return Types**: Always specify explicit return types for functions

## ConsentFlow Architecture

ConsentFlow is a consent management system where:

-   **Profiles** can create and consent to **Contracts**
-   **Contracts** define data access requirements (read/write permissions)
-   **Terms** record a profile's consent to a contract
-   **Transactions** record actions taken against Terms (consent, withdraw, update, sync)
-   **Credentials** can be issued through contract consent or synced by users from their existing credentials

### Relationship Flow

1. Profile → Contract: Profiles create contracts defining data requirements
2. Profile → Terms → Contract: Profiles consent to contracts via Terms
3. Transaction → Terms: Transactions record actions against Terms
4. Credential → Transaction → Terms: Credentials issued via contract are linked to a transaction
5. Contract → Boost: Contracts can define AutoBoosts that are automatically issued when a user consents
6. Sync → Terms: Users can sync existing credentials to specific categories in their terms

### Transaction Types

-   **Consent Transaction**: Created when a user initially consents to a contract
-   **Update Transaction**: Created when a user updates their terms
-   **Withdraw Transaction**: Created when a user withdraws consent
-   **Sync Transaction**: Created when a user syncs credentials to specific categories
-   **Write Transaction**: Created when credentials are issued through a contract (usually via auto-boosts)

### Neo4j & Neogma Integration

-   Neo4j is used as the graph database for storing entities and relationships
-   Neogma serves as an ORM providing model definitions with schemas
-   Models define node labels, properties, relationships, and primary keys
-   Relationships are defined with direction, name, and target model
-   QueryBuilder is used for complex queries with relationship traversal

### Handling Nested Objects

-   Neo4j can't store deeply nested objects directly
-   The system uses:
    -   `flattenObject()`: Converts nested structures to dot-notation keys
    -   `inflateObject()`: Restores flattened objects to nested structure
-   Example conversion:
    ```json
    // Original
    { "contract": { "read": { "personal": { "name": true } } } }
    // Flattened
    { "contract.read.personal.name": true }
    ```
-   This pattern is essential for storing complex objects in Neo4j

### Common Data Flow Patterns

-   **Data Queries**: Use `convertDataQueryToNeo4jQuery()` for Neo4j compatibility
-   **Category Filtering**: Use `shouldIncludeCategory()` to filter credentials by category
-   **Relationship Creation**: Follow the pattern shown in the relationship creation functions
-   **Transaction Recording**: Create transactions for all important actions

### Signing Authorities

-   Signing Authorities are external services that sign credentials on behalf of profiles
-   Each profile can register multiple signing authorities via `usesSigningAuthority` relationships
-   Signing authorities are stored in the SigningAuthority model with an endpoint URL
-   The relationship between Profile and SigningAuthority contains:
    -   `name`: A name identifier for the signing authority (e.g., "default")
    -   `did`: The DID that the signing authority will use to sign credentials
-   When issuing credentials through a signing authority:
    1. The system makes a request to the signing authority's endpoint
    2. It passes the unsigned credential, owner DID, and signing authority details
    3. The signing authority signs the credential and returns it
    4. The `issueCredentialWithSigningAuthority()` helper handles this flow
-   A common pattern is to get a signing authority with `getSigningAuthorityForUserByName(profile, endpoint, name)`

### AutoBoosts

-   AutoBoosts are credentials automatically issued when a user consents to a contract
-   An existing Boost is attached to a Contract via the `AUTO_RECEIVE` relationship
-   When creating a contract with autoboosts, an array of autoboosts must be provided, each with a boost URI and signing authority:
    ```typescript
    {
        // other contract fields
        autoboosts: [
            {
                boostUri: 'boost:123',
                signingAuthority: {
                    endpoint: 'https://signing-authority.example.com',
                    name: 'my-authority',
                },
            },
            {
                boostUri: 'boost:456',
                signingAuthority: {
                    endpoint: 'https://other-authority.example.com',
                    name: 'other-authority',
                },
            },
        ];
    }
    ```
-   The signing authority information is stored on each `AUTO_RECEIVE` relationship
-   When a user consents to a contract, all attached AutoBoosts are:
    1. Issued using the specified signing authority of the contract owner
    2. Sent to the consenting user
    3. Recorded with a 'write' action transaction on the terms
-   AutoBoosts are processed during:
    -   Initial consent via `consentToContract()`
    -   Re-consent via `reconsentTerms()`
    -   Terms update via `updateTerms()`
-   The contract owner MUST have the specified signing authority configured for each autoboost to work correctly
-   If a specified signing authority doesn't exist, that specific autoboost will be skipped with an error message
-   Multiple autoboosts can use the same signing authority or different ones

### Credential Syncing

-   Users can sync their existing credentials to a contract they've consented to
-   Syncing uses the `syncCredentialsToContract` API endpoint
-   The sync process:
    1. User identifies which credentials to share in which categories
    2. User calls `syncCredentialsToContract` with `termsUri` and a map of categories to credential URIs:
        ```typescript
        {
          termsUri: "terms:abc123",
          categories: {
            "Achievement": ["credential:123", "credential:456"],
            "Education": ["credential:789"]
          }
        }
        ```
    3. System performs validation:
        - Verifies the terms exist and belong to the requesting user
        - Ensures terms are still live (not withdrawn or expired)
        - Confirms all categories exist in the contract definition
    4. System creates a 'sync' transaction with the categorized credentials
    5. System updates the terms by adding the synced credentials to the shared arrays for each category
    6. Contract owner receives a notification about the sync action
-   The transaction and terms data use the same structure format for categories
-   All synced credentials are added to the existing shared arrays (if any) for each category
-   Duplicate credential URIs are automatically deduplicated

## Service-Level Boost Sending via Signing Authority

### Context

For certain workflows, such as sending a boost (credential) to another profile via HTTP service routes, the server cannot access the user's key material for security reasons. To enable credential issuance in these cases, the system supports **Signing Authorities**.

### Signing Authorities & Credential Issuance

-   **Signing Authority**: An external service registered by a user/profile that can sign credentials on their behalf.
-   Users register signing authorities by specifying an endpoint and a name.
-   When sending a boost via HTTP, the service uses the registered signing authority to sign the credential and deliver it to the recipient.

### Example: `/boost/send/via-signing-authority` Route

-   **Input:** `{ profileId, boostUri, signingAuthority: { name, endpoint } }`
-   **Flow:**
    1. Fetch the boost by URI.
    2. Fetch the recipient profile.
    3. Prepare an unsigned VC for the recipient.
    4. Use the specified signing authority to sign the VC.
    5. Deliver the signed VC to the recipient via the network.
-   **Testing:** E2E tests should POST directly to the route using fetch, after registering a signing authority for the sender.

### Best Practices for AI Assistants

-   Always check for the availability of key material before issuing credentials server-side. If unavailable, require a signing authority.
-   Document the expected flow, security implications, and how to set up signing authorities in both code and tests.
-   Prefer direct HTTP calls in E2E tests for service-only routes, and demonstrate signing authority setup in test code.
