# @learncard/ler-rs-plugin

Create, package, and verify Learning & Employment Record Resume (LER-RS) credentials.

## Install

This plugin is part of the LearnCard monorepo and is built with the workspace.

## API

- `createLerRecord(params: CreateLerRecordParams): Promise<VC>`
- `createLerPresentation(params: CreateLerPresentationParams): Promise<VP>`
- `verifyLerPresentation(params: VerifyLerPresentationParams): Promise<VerificationResult>`

See `src/types.ts` for types and `src/ler-rs.ts` for implementation details.

## Notes

- Follows the HR Open LER-RS container + verification pattern by embedding VCs in `verifications` arrays.
- Ensures credential and presentation `type` fields are non-empty arrays.

---

## Requirements

- Your `LearnCard` must already have the VC plugin installed (provided by standard `@learncard/init` initializers).
- Add this plugin by passing the base LearnCard to the factory and then calling `addPlugin`:

```ts
import { getLerRsPlugin } from '@learncard/ler-rs-plugin';

// baseLc should already include the VC plugin (e.g., via @learncard/init)
const lc = await baseLc.addPlugin(getLerRsPlugin(baseLc));
```

The plugin captures `baseLc` internally to issue and verify VCs/VPs.

## Quick start

```ts
import type {
  PersonProfile,
  WorkHistoryItem,
  EducationHistoryItem,
  CertificationItem,
} from '@learncard/ler-rs-plugin';
import { getLerRsPlugin } from '@learncard/ler-rs-plugin';

// 1) Add plugin
const lc = await baseLc.addPlugin(getLerRsPlugin(baseLc));

// 2) Build a LER-RS credential (self-asserted + optional embedded VCs)
const person: PersonProfile = {
  id: 'did:example:alice',
  givenName: 'Alice',
  familyName: 'Anderson',
  email: 'alice@example.com',
};

const workHistory: WorkHistoryItem[] = [
  {
    position: 'Marketing Professional',
    employer: 'ABC Company',
    start: '2022-01-01',
    end: '2024-06-01',
    narrative: 'Led a multi-channel campaign with 200% ROI.',
  },
];

const educationHistory: EducationHistoryItem[] = [
  {
    institution: 'State University',
    degree: 'B.S. Business',
    specializations: ['Marketing Analytics'],
    start: '2018-09-01',
    end: '2022-05-15',
  },
];

const certifications: CertificationItem[] = [
  {
    name: 'Google Analytics Certification',
    issuingAuthority: 'Google',
    status: 'active',
    narrative: 'Validated proficiency in GA4 and attribution modeling.',
  },
];

const skills = ['SEO/SEM', 'Content Strategy', 'Team Leadership'];

const lerVc = await lc.invoke.createLerRecord({
  person,
  workHistory,
  educationHistory,
  certifications,
  skills,
});

// 3) Package into a VP (must include at least one LER-RS VC)
const vp = await lc.invoke.createLerPresentation({
  credentials: [lerVc],
  domain: 'apply.acme.com',
  challenge: 'a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8',
});

// 4) Verify the presentation
const verification = await lc.invoke.verifyLerPresentation({
  presentation: vp,
  domain: 'apply.acme.com',
  challenge: 'a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8',
});

console.log(verification.verified);
for (const r of verification.credentialResults) {
  console.log(r.credential.id, r.verified, r.isSelfIssued, r.errors);
}
```

## Wrapping existing VCs inside containers

Each container item (`workHistory`, `educationHistory`, `certifications`) can embed externally issued VCs as verifications. Provide `verifiableCredential` in the item to include it under `verifications`:

```ts
// Assume employmentVc is a third-party or previously issued VC
const employmentVc = await lc.read.get('urn:uuid:employment-123');

const lerWithProof = await lc.invoke.createLerRecord({
  person,
  workHistory: [
    {
      narrative: 'My key responsibilities and outcomes.',
      verifiableCredential: employmentVc,
    },
  ],
});
```

## Schema mapping guidance

This plugin follows a "Container + Verifiable Proof" model. For `credentialSubject` (LER-RS payload), we map as follows (see `src/ler-rs.ts`):

- __person__
  - From `params.person`
  - Maps to `credentialSubject.person` with `name.given`, `name.family`, and `name.formattedName`

- __communication__
  - If `person.email` is provided, becomes `credentialSubject.communication.email = [{ address: email }]`

- __skills__
  - `params.skills: string[]` → `credentialSubject.skills = [{ name: string }]`

- __employmentHistories__ (from `params.workHistory`)
  - `employer` → `container.organization.tradeName`
  - `position`, `start`, `end` → `container.positionHistories = [{ title, start, end }]`
  - `narrative` → `container.narrative`
  - `verifiableCredential` or `verifications` → `container.verifications = [VC]`
  - Any other keys on the item are merged into the container as-is

- __educationAndLearnings__ (from `params.educationHistory`)
  - `institution` → `container.institution = { name: institution }`
  - `start`, `end` → same key names on container
  - `degree`, `specializations` → `container.educationDegrees = [{ name: degree, specializations: [{ name }] }]`
  - `narrative` → `container.narrative`
  - `verifiableCredential` or `verifications` → `container.verifications = [VC]`

- __certifications__ (from `params.certifications`)
  - All provided keys are copied into the container
  - `narrative` → `container.narrative`
  - `verifiableCredential` or `verifications` → `container.verifications = [VC]`

Resulting VC shape (high-level):

```ts
{
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'http://schema.hropenstandards.org/4.5/recruiting/json/VerifiableCredentialLER-RSType.json',
  ],
  type: ['VerifiableCredential', 'http://schema.hropenstandards.org/4.5/recruiting/json/LER-RSType.json'],
  issuer: 'did:...issuer',
  issuanceDate: '...',
  credentialSubject: {
    id: 'did:...subject',
    type: 'http://schema.hropenstandards.org/4.5/recruiting/json/LER-RSType.json',
    person: { name: { given, family, formattedName } },
    communication?: { email?: [{ address }] },
    skills?: [{ name }],
    employmentHistories?: [{ ...container, verifications?: [VC] }],
    educationAndLearnings?: [{ ...container, verifications?: [VC] }],
    certifications?: [{ ...container, verifications?: [VC] }],
  },
}
```

## Verification behavior

- `verifyLerPresentation` verifies the VP and each embedded VC.
- `VerificationResult.verified` is true when:
  - The presentation verifies, and
  - Every credential either verifies OR is considered self-issued.
- A credential is considered __self-issued__ when:
  - It is recognized as an LER-RS credential by known legacy/current LER-RS types, or
  - Its `issuer` DID equals the VP `holder` DID.

## Troubleshooting

- __Non-empty type arrays__: VC/VP `type` are always emitted as non-empty arrays to satisfy validators (e.g., Zod schemas that require `[string, ...string[]]`).
- __Missing VC plugin__: Ensure your base LearnCard already includes `@learncard/vc-plugin` (standard in `@learncard/init` initializers).

## Contributing

- Types live in `src/types.ts`. Implementation is in `src/ler-rs.ts`.
- Please add tests for new behaviors and keep examples in this README up-to-date with the code.
