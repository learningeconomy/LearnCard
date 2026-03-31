# @learncard/credential-library

A comprehensive, queryable library of Verifiable Credential fixtures for testing, development, and regression prevention across the VC ecosystem.

## Why?

The Verifiable Credential standard is infinitely customizable and always evolving. LearnCard adds enhanced support for specific schemas (OBv3, CLR v2, Boosts, etc.), and testing all flows (claiming, viewing, sharing, verifying) requires a diverse set of credential examples.

This package provides:

- **Real and synthetic credential fixtures** spanning VC v1, v2, OBv3, CLR v2, and LearnCard Boosts
- **Rich metadata** per fixture: spec, profile, features exercised, source, validity
- **Queryable API** to filter fixtures by any combination of metadata
- **Fixture preparation** for real issuance — patch in DIDs, timestamps, and fresh UUIDs
- **Self-validating test suite** that ensures every fixture passes its declared Zod validator
- **Issuance integration tests** that verify every valid fixture can be issued by a real LearnCard wallet
- **Intentionally invalid fixtures** for negative testing
- **One-file-per-fixture** pattern that makes it trivial to add new credentials

## Quick Start

### Querying Fixtures

```typescript
import {
    getAllFixtures,
    getFixtures,
    getFixture,
    findFixture,
    getValidFixtures,
    getInvalidFixtures,
    getUnsignedFixtures,
    getSignedFixtures,
    getStats,
} from '@learncard/credential-library';

// All fixtures
const all = getAllFixtures();

// Only OBv3 badges
const badges = getFixtures({ spec: 'obv3', profile: 'badge' });

// Fixtures with evidence AND alignment
const rich = getFixtures({ features: ['evidence', 'alignment'] });

// Fixtures with ANY of these features
const interesting = getFixtures({ featuresAny: ['skills', 'endorsement', 'nested-credentials'] });

// One specific fixture (throws if not found)
const jff = getFixture('obv3/plugfest-jff2');

// One specific fixture (returns undefined if not found)
const maybe = findFixture('obv3/does-not-exist');

// Only valid / only invalid
const valid = getValidFixtures();
const invalid = getInvalidFixtures();

// Stats breakdown
const stats = getStats();
// => { total, bySpec, byProfile, byValidity, signed, unsigned }
```

### Issuing Fixtures with a LearnCard Wallet

```typescript
import { getFixture, prepareFixture, prepareFixtureById } from '@learncard/credential-library';
import { initLearnCard } from '@learncard/init';

const wallet = await initLearnCard({ seed: '...' });
const issuerDid = wallet.id.did();

// Option A: get fixture, then prepare
const fixture = getFixture('obv3/full-badge');
const unsigned = prepareFixture(fixture, {
    issuerDid,
    subjectDid: 'did:example:recipient',
});

// Option B: one-liner with prepareFixtureById
const unsigned2 = prepareFixtureById('boost/basic', { issuerDid });

// Issue the credential
const signed = await wallet.invoke.issueCredential(unsigned);
```

`prepareFixture` deep-clones the fixture and patches:

- **Issuer DID** — replaces the placeholder issuer with your wallet's DID
- **Subject DID** — optionally replaces the subject DID
- **Fresh UUIDs** — regenerates all `urn:uuid:` ids (disable with `freshIds: false`)
- **Timestamps** — sets `validFrom`/`issuanceDate` to now (or a custom value)

## Query API Reference

| Function | Description |
|----------|-------------|
| `getAllFixtures()` | Returns all registered fixtures |
| `getFixture(id)` | Returns a fixture by ID (throws if not found) |
| `findFixture(id)` | Returns a fixture by ID (returns `undefined` if not found) |
| `getFixtures(filter)` | Returns fixtures matching the filter |
| `getValidFixtures(filter?)` | Shorthand for `getFixtures({ ...filter, validity: 'valid' })` |
| `getInvalidFixtures(filter?)` | Shorthand for `getFixtures({ ...filter, validity: ['invalid', 'tampered'] })` |
| `getUnsignedFixtures(filter?)` | Returns only unsigned fixtures |
| `getSignedFixtures(filter?)` | Returns only signed fixtures |
| `getStats()` | Returns counts grouped by spec, profile, validity, and signed status |
| `prepareFixture(fixture, options)` | Clones a fixture and patches DIDs, UUIDs, and timestamps |
| `prepareFixtureById(id, options)` | Combines `getFixture` + `prepareFixture` |

### FixtureFilter

All filter fields are optional. Array fields accept a single value or an array.

| Field | Type | Behavior |
|-------|------|----------|
| `spec` | `CredentialSpec \| CredentialSpec[]` | Match any of the given specs |
| `profile` | `CredentialProfile \| CredentialProfile[]` | Match any of the given profiles |
| `features` | `CredentialFeature[]` | Must have **all** of these features |
| `featuresAny` | `CredentialFeature[]` | Must have **any** of these features |
| `signed` | `boolean` | Filter by signed status |
| `validity` | `FixtureValidity \| FixtureValidity[]` | Match any of the given validities |
| `source` | `FixtureSource \| FixtureSource[]` | Match any of the given sources |
| `tags` | `string[]` | Must have **all** of these tags |

## Adding a Fixture

### Option 1: Create a file manually

1. Create a file in `src/fixtures/<spec-dir>/my-fixture.ts`:

```typescript
import type { CredentialFixture } from '../../types';

export const myFixture: CredentialFixture = {
    id: 'vc-v2/my-fixture',
    name: 'My New Fixture',
    description: 'What this fixture tests or demonstrates',
    spec: 'vc-v2',
    profile: 'generic',
    features: [],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    credential: {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer',
        validFrom: '2024-01-01T00:00:00Z',
        credentialSubject: { id: 'did:example:subject' },
    },
};
```

2. Add the import and registration in `src/fixtures/index.ts`

3. Run `pnpm test` — both the self-validating and issuance suites will check your fixture automatically

### Option 2: Use the Credential Viewer UI

The `examples/credential-viewer` app has a **New Fixture** button that provides a form with:

- JSON editor with metadata auto-inference
- JSON file upload
- Test Issue button (requires wallet connection)
- Saves the `.ts` file and updates the index automatically

See the [Credential Viewer README](../../examples/credential-viewer/README.md) for details.

## Fixture Metadata

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier, e.g. `obv3/minimal-badge` |
| `name` | `string` | Human-readable name |
| `description` | `string` | What this fixture tests/demonstrates |
| `spec` | `CredentialSpec` | `vc-v1`, `vc-v2`, `obv3`, `clr-v2`, `europass`, `custom` |
| `profile` | `CredentialProfile` | `badge`, `diploma`, `certificate`, `id`, `membership`, `license`, `micro-credential`, `course`, `degree`, `boost`, `boost-id`, `delegate`, `endorsement`, `learner-record`, `generic` |
| `features` | `CredentialFeature[]` | Features exercised: `evidence`, `alignment`, `endorsement`, `expiration`, `status`, `multiple-subjects`, `image`, `results`, `skills`, `display`, `associations`, `nested-credentials`, etc. |
| `source` | `FixtureSource` | `spec-example`, `plugfest`, `real-world`, `synthetic` |
| `signed` | `boolean` | Whether the credential has a proof |
| `validity` | `FixtureValidity` | `valid`, `invalid`, or `tampered` |
| `validator` | `z.ZodType?` | Optional Zod validator from `@learncard/types` |
| `tags` | `string[]?` | Additional free-form tags for ad-hoc filtering |

## Available Fixtures

### VC v1 (3)
- `vc-v1/basic` — Minimal VCDM v1 credential
- `vc-v1/with-status` — With StatusList2021 credential status
- `vc-v1/alumni-credential` — University alumni credential

### VC v2 (8)
- `vc-v2/basic` — Minimal VCDM v2 credential
- `vc-v2/with-evidence` — With evidence array
- `vc-v2/multiple-subjects` — With multiple credential subjects
- `vc-v2/employment-credential` — Employment verification credential
- `vc-v2/education-degree` — University bachelor degree credential
- `vc-v2/digital-id` — Government digital identity credential
- `vc-v2/membership-credential` — Professional association membership
- `vc-v2/license-credential` — Professional nursing license

### Open Badges v3 (11)
- `obv3/minimal-badge` — Minimal OBv3 achievement credential
- `obv3/full-badge` — Full-featured badge with image, evidence, alignment, results, expiration
- `obv3/with-alignment` — With competency framework alignments
- `obv3/with-endorsement` — With embedded endorsement credential
- `obv3/plugfest-jff2` — JFF PlugFest 2 interoperability badge
- `obv3/1edtech-full` — 1EdTech complete OpenBadgeCredential (spec reference)
- `obv3/professional-cert` — AWS Solutions Architect professional certification
- `obv3/micro-credential` — Data Science Fundamentals micro-credential
- `obv3/course-completion` — Introduction to Machine Learning course completion
- `obv3/k12-diploma` — High school diploma
- `obv3/endorsement-credential` — Program accreditation endorsement

### CLR v2 (4)
- `clr/minimal` — Minimal Comprehensive Learner Record
- `clr/multi-achievement` — Multiple achievements with associations
- `clr/nd-student-transcript` — North Dakota student transcript (nested VCs, real-world structure)
- `clr/university-transcript` — University academic transcript (6 nested course VCs)

### LearnCard Boosts (5)
- `boost/basic` — Basic BoostCredential with display
- `boost/boost-id` — BoostID membership card
- `boost/with-skills` — Boost with skills, evidence, and alignment
- `boost/community-award` — Community leadership award boost
- `boost/delegate` — Organization delegate credential

### Invalid / Negative Tests (3)
- `invalid/missing-context` — No @context
- `invalid/empty-type` — Empty type array
- `invalid/missing-issuer` — No issuer field

## Tests

```bash
pnpm test
```

Two test suites run automatically:

- **`registry.test.ts`** — Validates every fixture against its Zod validator, checks metadata consistency, and tests the query/filter API
- **`issuance.test.ts`** — Creates a real LearnCard wallet instance and calls `issueCredential()` on every valid fixture, verifying that each produces a signed VC with a proof

### JSON-LD Context Notes

All valid fixtures use `@context` URLs that are either statically cached in DidKit or fetchable via `allowRemoteContexts`. If you add a fixture with custom terms, make sure they are defined in one of the included contexts. Common choices:

- `https://www.w3.org/2018/credentials/examples/v1` — Example terms for VC v1 (`degree`, `alumniOf`, etc.)
- `https://www.w3.org/ns/credentials/examples/v2` — Example terms for VC v2 (`degree`, `role`, etc.)
- `https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json` — OBv3 terms (cached in DidKit)
- `https://purl.imsglobal.org/spec/clr/v2p0/context.json` — CLR v2 terms (cached in DidKit)
