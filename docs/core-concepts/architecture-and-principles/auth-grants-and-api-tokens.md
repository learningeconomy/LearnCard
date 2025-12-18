# Auth Grants and API Tokens

### Overview

AuthGrants are a secure permission system that allows third-party applications to access the LearnCard Network API with specific, limited permissions. This documentation explains how to create and manage AuthGrants, generate API tokens, and use them to make authenticated API requests.

### Understanding AuthGrants

#### What is an AuthGrant?

An AuthGrant is a permission object that:

* Defines specific access rights (scopes) granted to a client application
* Has a defined lifecycle (creation, active period, expiration, revocation)
* Includes metadata such as name, description, and status
* Serves as the basis for generating API tokens for authentication

#### Scope System

AuthGrants use a scope-based permission model following the pattern: `{resource}:{action}`

**Resources:**

* `boosts`
* `claimHook`
* `profile`
* `profileManager`
* `credential`
* `presentation`
* `storage`
* `utilities`
* `contracts`
* `didMetadata`
* `authGrants`

**Actions:**

* `read`: Permission to view resources
* `write`: Permission to create or update resources
* `delete`: Permission to remove resources

**Special Patterns:**

* All access: `*:*`
* Read all: `*:read`
* Resource-wide: `authGrants:*`
* Multiple scopes: Space-separated list (e.g., `"authGrants:read contracts:write"`)

**Common Scope Bundles:**

```javascript
// Common scope bundles
const AUTH_GRANT_READ_ONLY_SCOPE = '*:read';
const AUTH_GRANT_FULL_ACCESS_SCOPE = '*:*';
const AUTH_GRANT_NO_ACCESS_SCOPE = '';
const AUTH_GRANT_PROFILE_MANAGEMENT_SCOPE = 'profile:* profileManager:*';
const AUTH_GRANT_CREDENTIAL_MANAGEMENT_SCOPE = 'credential:* presentation:* boosts:*';
const AUTH_GRANT_CONTRACTS_SCOPE = 'contracts:*';
const AUTH_GRANT_DID_METADATA_SCOPE = 'didMetadata:*';
const AUTH_GRANT_AUTH_GRANTS_SCOPE = 'authGrants:*';
```

## Working with Auth Grants & API Tokens

* Follow a tutorial on how to programmatically [generate-api-tokens.md](../../how-to-guides/deploy-infrastructure/generate-api-tokens.md "mention")
* Explore Usage Examples with LearnCard SDK Wallet

### Security Considerations

* Once an AuthGrant is created, its scope and challenge are locked in. If a change is needed, the recommended pattern is to revoke the old grant and issue a new one with the desired properties.
* Store API tokens securely; they grant access according to the AuthGrant's scope
* Use the principle of least privilege: request only the scopes needed for your application
* Set appropriate expiration times for AuthGrants when creating them
* Revoke AuthGrants when they are no longer needed
