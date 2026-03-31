# @learncard/credential-library

A comprehensive, queryable library of Verifiable Credential fixtures for testing, development, and regression prevention across the VC ecosystem.

## Why?

The Verifiable Credential standard is infinitely customizable and always evolving. LearnCard adds enhanced support for specific schemas (OBv3, CLR v2, Boosts, etc.), and testing all flows (claiming, viewing, sharing, verifying) requires a diverse set of credential examples.

This package provides:

- **Real and synthetic credential fixtures** spanning VC v1, v2, OBv3, CLR v2, and LearnCard Boosts
- **Rich metadata** per fixture: spec, profile, features exercised, source, validity
- **Queryable API** to filter fixtures by any combination of metadata
- **Self-validating test suite** that ensures every fixture passes its declared Zod validator
- **Intentionally invalid fixtures** for negative testing
- **One-file-per-fixture** pattern that makes it trivial to add new credentials

## Quick Start

```typescript
import {
    getAllFixtures,
    getFixtures,
    getFixture,
    getValidFixtures,
    getInvalidFixtures,
} from '@learncard/credential-library';

// All fixtures
const all = getAllFixtures();

// Only OBv3 badges
const badges = getFixtures({ spec: 'obv3', profile: 'badge' });

// Fixtures with evidence AND alignment
const rich = getFixtures({ features: ['evidence', 'alignment'] });

// One specific fixture
const jff = getFixture('obv3/plugfest-jff2');

// Only valid / only invalid
const valid = getValidFixtures();
const invalid = getInvalidFixtures();
```

## Adding a Fixture

1. Create a file in `src/fixtures/<spec-dir>/my-fixture.ts`:

```typescript
import { UnsignedVCValidator } from '@learncard/types';
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
    validator: UnsignedVCValidator,
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

3. Run `pnpm test` — the self-validating suite will check your fixture automatically

## Fixture Metadata

| Field | Description |
|-------|-------------|
| `id` | Unique identifier, e.g. `obv3/minimal-badge` |
| `name` | Human-readable name |
| `description` | What this fixture tests/demonstrates |
| `spec` | `vc-v1`, `vc-v2`, `obv3`, `clr-v2`, `europass`, `custom` |
| `profile` | `badge`, `diploma`, `certificate`, `id`, `membership`, `license`, `micro-credential`, `course`, `degree`, `boost`, `boost-id`, `delegate`, `endorsement`, `learner-record`, `generic` |
| `features` | Array of features exercised: `evidence`, `alignment`, `endorsement`, `expiration`, `status`, `multiple-subjects`, `image`, `results`, `skills`, `display`, etc. |
| `source` | `spec-example`, `plugfest`, `real-world`, `synthetic` |
| `signed` | Whether the credential has a proof |
| `validity` | `valid`, `invalid`, or `tampered` |
| `validator` | Zod validator from `@learncard/types` |
| `tags` | Additional free-form tags |

## Available Fixtures

### VC v1
- `vc-v1/basic` — Minimal VCDM v1 credential
- `vc-v1/with-status` — With StatusList2021 credential status

### VC v2
- `vc-v2/basic` — Minimal VCDM v2 credential
- `vc-v2/with-evidence` — With evidence array
- `vc-v2/multiple-subjects` — With multiple credential subjects

### Open Badges v3
- `obv3/minimal-badge` — Minimal OBv3 achievement credential
- `obv3/full-badge` — Full-featured badge with image, evidence, alignment, results, expiration
- `obv3/with-alignment` — With competency framework alignments
- `obv3/with-endorsement` — With embedded endorsement credential
- `obv3/plugfest-jff2` — JFF PlugFest 2 interoperability badge

### CLR v2
- `clr/minimal` — Minimal Comprehensive Learner Record
- `clr/multi-achievement` — Multiple achievements with associations

### LearnCard Boosts
- `boost/basic` — Basic BoostCredential with display
- `boost/boost-id` — BoostID membership card
- `boost/with-skills` — Boost with skills, evidence, and alignment

### Invalid (Negative Tests)
- `invalid/missing-context` — No @context
- `invalid/empty-type` — Empty type array
- `invalid/missing-issuer` — No issuer field
