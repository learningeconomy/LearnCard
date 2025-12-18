# Overview

#### 🎟 Relevant Jira Issues

Fixes: LC-1472

#### 📚 What is the context and goal of this PR?

Adds a new generic `send` method that provides an ergonomic way to send credentials in the LearnCard Network. It handles boost template resolution, credential issuance (client-side when available, otherwise via signing authority), and consent flow integration automatically.

#### 🥴 TL; RL:

-   New `send` method for ergonomic credential sending
-   Client-side issuance when possible, falls back to signing authority
-   Contract-aware: routes through consent flow when recipient has consented
-   Creates `RELATED_TO` relationship between new boosts and contracts
-   Discriminated union pattern for future extensibility (e.g., other send types)

#### 💡 Feature Breakdown (screenshots & videos encouraged!)

**New `send` API:**

```typescript
// Send using existing boost template
await lc.invoke.send({
    type: 'boost',
    recipient: 'userProfileId', // or DID
    templateUri: 'urn:lc:boost:...',
});

// Send by creating a new boost on-the-fly
await lc.invoke.send({
    type: 'boost',
    recipient: 'userProfileId',
    template: { credential: unsignedVC, category: 'Achievement' },
    contractUri: 'urn:lc:contract:...', // optional - routes through consent flow
});

// Returns: { type: 'boost', credentialUri: '...', uri: '...' }
```

**Key features:**

-   `recipient` accepts either profileId or DID
-   Client-side credential issuance when `issueCredential` is available in the LearnCard instance
-   Falls back to signing authority for API token users or when client-side issuance unavailable
-   Contract integration with automatic consent flow routing

#### 🛠 Important tradeoffs made:

-   TRPC doesn't support `z.discriminatedUnion` as input validators, so we use separate validators:
    -   Route-level: `SendBoostInputValidator` (ZodObject - TRPC compatible)
    -   Plugin-level: `SendInputValidator` (discriminated union - for type extensibility)
-   The `type` field is required (no default) due to discriminated union constraints

#### 🔍 Types of Changes

-   [ ] Bug fix (non-breaking change which fixes an issue)
-   [x] New feature (non-breaking change which adds functionality)
-   [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
-   [ ] Chore (refactor, documentation update, etc)

#### 💳 Does This Create Any New Technical Debt? ( If yes, please describe and [add JIRA TODOs](https://welibrary.atlassian.net/jira/software/projects/WE/boards/2) )

-   [x] No
-   [ ] Yes

# Testing

#### 🔬 How Can Someone QA This?

1. Build types: `pnpm exec nx build types`
2. Run unit tests: `cd services/learn-card-network/brain-service && pnpm test -- --run -t "send" --no-coverage`
3. Run E2E tests: `cd tests/e2e && pnpm test:e2e -- --run -t "Send"`
4. Test manually by calling `learnCard.invoke.send({ type: 'boost', recipient: '<profileId>', templateUri: '<boostUri>' })`

#### 📱 🖥 Which devices would you like help testing on?

N/A - Backend/SDK changes only

#### 🧪 Code Coverage

-   Unit tests added in `boosts.spec.ts` for send method
-   Unit tests added in `consentflow.spec.ts` for contract integration
-   E2E tests added in `ergonomic-send-boost.spec.ts`

# Documentation

#### 📜 Gitbook

Documentation needed for the new `send` method API.

#### 📊 Storybook

N/A

# ✅ PR Checklist

-   [x] Related to a Jira issue ([create one if not](https://welibrary.atlassian.net/jira/software/projects/WE/boards/2))
-   [x] My code follows **style guidelines** (eslint / prettier)
-   [x] I have **manually tested** common end-2-end cases
-   [x] I have **reviewed** my code
-   [x] I have **commented** my code, particularly where ambiguous
-   [x] New and existing **unit tests pass** locally with my changes
-   [ ] I have made corresponding changes to **gitbook documentation**

### 🚀 Ready to squash-and-merge?:

-   [x] Code is backwards compatible
-   [x] There is **not** a "Do Not Merge" label on this PR
-   [x] I have thoughtfully considered the security implications of this change.
-   [x] This change does not expose new public facing endpoints that do not have authentication
