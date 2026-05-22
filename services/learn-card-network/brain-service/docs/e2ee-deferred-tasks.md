# E2EE Deferred Tasks

This document tracks technical debt and architectural changes deferred during the initial E2EE hardening implementation. These tasks are necessary to maintain full functionality (like skill search) while moving toward an encrypted-by-default model.

## Phase 4.4: Structured Skill Extraction for Encrypted Credentials

### The Problem
Currently, the `brain-service` performs server-side skill extraction by parsing the `instance.credential` field of a `Credential` node in Neo4j. This field contains the raw JSON-LD or JWT representation of the Verifiable Credential.

With the introduction of E2EE (JWE payloads), the server can no longer parse the credential content because it is encrypted for the recipient. This breaks:
1. Skill graph indexing
2. Skill-based search and discovery
3. Automated role granting based on credential content

### The Solution: Decoupled Extraction
Instead of parsing the credential on-demand or during background indexing, we must extract the relevant structured data at **issue time**, while the issuer (or the service acting on their behalf) still has access to the plaintext content.

### Implementation Approach

1. **Schema Update**: Add an `extractedSkills` property to the `Credential` model in Neo4j.
   - Type: `string[]`
   - Purpose: Stores a list of skill identifiers (URIs or names) extracted from the credential.

2. **Issue-Time Population**: Update the credential issuance logic (e.g., in `issueCredentialWithSigningAuthority` or the boost issuance flow) to:
   - Parse the plaintext credential before encryption.
   - Extract skills from the `achievement` or `credentialSubject` fields.
   - Pass these skills to the database access layer when creating the `Credential` node.

3. **Query Refactoring**: Update skill-related queries in `src/accesslayer/` to use the `extractedSkills` property instead of attempting to parse the `credential` string.

4. **Backward Compatibility**: For existing plaintext credentials, a one-time migration script should populate the `extractedSkills` field by parsing the existing `credential` JSON.

### Benefits
- **Privacy**: The server maintains a searchable index of skills without needing access to the full, potentially sensitive, credential content.
- **Performance**: Querying a native string array in Neo4j is significantly faster than parsing JSON strings during query execution.
- **Scalability**: This pattern can be extended to other searchable fields (e.g., `extractedDates`, `extractedIssuer`) as needed.
