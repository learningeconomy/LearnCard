# Resume Builder LER-RS Mapping

This page documents how the LearnCard App Resume Builder publishes a resume as a LER-RS credential, how client-side resume data is normalized before issuance, and which parts of the current implementation are intentionally constrained.

## Publish Flow

When a user publishes a resume, the LearnCard App does the following:

1. Collect the credentials currently selected in the Resume Builder.
2. Upload the generated PDF to Filestack and keep the returned public URL.
3. Read each selected source credential from the active wallet.
4. Build a normalized client-side payload for `createLerRecord`.
5. Issue a signed LER-RS Verifiable Credential.
6. Store the issued LER-RS credential in LearnCloud.
7. Create or update a `resume` index record in LearnCloud so the latest published resume can be discovered later.

At a high level, the path is:

`Resume Builder state -> LerRecordInput[] -> createLerRecord payload -> signed LER-RS VC -> LearnCloud storage + resume index record`

## The `LerRecordInput` Shape

The Resume Builder first normalizes each selected credential into an internal helper shape before building the final LER-RS payload:

```ts
type LerRecordInput = {
    uri: string;
    category: string;
    vc?: VC;
    narrative?: string;
    metadata?: string[];
    current?: boolean;
    startDateOverride?: string;
    endDateOverride?: string;
};
```

What each field means:

- `uri`: the wallet or LearnCloud URI for the selected source credential.
- `category`: the Resume Builder section/category that determines which LER-RS array the item maps into.
- `vc`: the resolved source VC, if it can be read from the active wallet.
- `narrative`: the visible description text currently configured in the Resume Builder.
- `metadata`: the additional visible metadata/detail lines configured for the credential.
- `current`: work-history-only boolean derived from the "current role" toggle.
- `startDateOverride`: start date chosen in the Resume Builder UI, if any.
- `endDateOverride`: end date chosen in the Resume Builder UI, if any.

This structure is not the final wire format. It is a client-side normalization layer that lets the app merge:

- source VC data
- user-edited Resume Builder text
- UI-only toggles
- per-item date overrides

before calling `createLerRecord`.

## Personal Details Mapping

Visible personal details are mapped into the LER-RS payload as follows:

| Resume Builder field | LER-RS target |
| --- | --- |
| `name` | `person.name.given`, `person.name.family`, `person.name.formattedName` |
| `email` | `communication.email[].address` |
| `phone` | `communication.phone[].formattedNumber` |
| `location` | `communication.address[].formattedAddress` |
| `website` | `communication.web[]` with `{ url, name: "Website" }` |
| `linkedIn` | `communication.social[]` with `{ uri, name: "LinkedIn" }` |
| `career` | `narratives[]` as `"Professional Title"` |
| `summary` | `narratives[]` as `"Professional Summary"` |

### Hidden Field Behavior

If a personal detail is hidden in the Resume Builder UI, it is excluded from the issued LER-RS payload.

That means hidden values are not simply hidden from preview; they are omitted from issuance entirely.

## Credential Category Mapping

The Resume Builder maps sections into LER-RS arrays like this:

| Resume Builder category | LER-RS target |
| --- | --- |
| `Work History` | `employmentHistories[]` |
| `Learning History` | `educationAndLearnings[]` |
| `Social Badge` | `certifications[]` |
| `Achievement` | `certifications[]` |
| `Accomplishment` | `certifications[]` |
| `Accommodation` | `certifications[]` |

### Work History

Work-history items are built from:

- source VC-derived fields such as position, employer, and dates when available
- Resume Builder description and metadata
- the `current` boolean when the item is marked as the current role
- start/end overrides selected in the Resume Builder

### Education

Education items are built from:

- institution/school data
- degree/program data
- available specialization values
- Resume Builder description and metadata
- start/end overrides selected in the Resume Builder

### Certifications

Certification items are built from:

- credential/badge/license names
- issuing authority
- status
- start/end information normalized into `effectiveTimePeriod`
- Resume Builder description and metadata

## Date Override Behavior

The Resume Builder supports start and end date overrides per selected credential.

Precedence is:

1. selected Resume Builder override
2. date derived from the source VC
3. omitted if neither exists

This applies to:

- `employmentHistories`
- `educationAndLearnings`
- `certifications`

For certifications, the normalized result is:

- `effectiveTimePeriod.validFrom`
- `effectiveTimePeriod.validTo`

### Current Role

The "current role" toggle only applies to work-history items.

It is used to track:

- `current: true | false`

It does **not** control the start/end date pickers. Date pickers remain independent UI controls. The toggle is a semantic marker that is mapped to the LER payload, not a date UI mode switch.

## Source Credential Traceability

Each mapped LER item keeps a lightweight reference back to its source credential instead of embedding the full source VC.

The reference shape is:

```ts
type VerificationReference = {
    id: string;
    sourceCredentialUri: string;
};
```

Where:

- `id` is the source VC id when available, otherwise the source URI
- `sourceCredentialUri` is the wallet/LearnCloud URI of the original credential

This is intentionally lightweight.

The app does **not** embed the full source VC inside the LER payload. That design avoids JSON-LD expansion failures caused by nested foreign contexts while still preserving a stable reference back to the original credential.

## PDF Attachment Behavior

The generated resume PDF is stored in `attachments[]` as an external URL reference.

The current attachment payload includes:

- `url`: the Filestack-hosted PDF URL
- `descriptions[]`: generated timestamp + SHA-256 hash text

The current implementation intentionally does **not** include a nested attachment `id`. A previous version triggered JSON-LD expansion issues because nested `id` values could be interpreted as `@id` during VC processing.

## Context And Signing Notes

LER-RS issuance currently relies on an inline LER context during signing.

This is intentional. In practice:

- using the remote LER context URL caused remote-context expansion failures
- the inline context produced stable signing behavior

That means the current implementation optimizes for reliable issuance over strict dependence on runtime remote context resolution.

## Implementation Notes For Engineers

The `useIssueTcpResume` hook is intentionally structured in two layers:

1. **Normalization helpers**
   - `buildWorkHistoryItem`
   - `buildEducationItem`
   - `buildCertificationItem`
   - `buildLerPayloadFromResume`
2. **Publish orchestration**
   - wallet init
   - PDF upload
   - source VC resolution
   - LER-RS issuance
   - LearnCloud storage
   - resume index updates

This split is important because most future changes should happen in the normalization layer rather than the publish orchestration layer.

Examples:

- Adding a new Resume Builder field usually means updating `LerRecordInput` and one of the builder helpers.
- Changing where a personal detail maps should usually happen in `buildLerPayloadFromResume`.
- Changing storage or indexing behavior should happen in the publish orchestration path.

## Current Known Gaps And Non-Goals

- `thumbnail` is not mapped.
- Free-form `location` currently maps only to `formattedAddress`.
- Structured address parsing (`line`, `city`, `postalCode`, `countryCode`) is not derived from the current free-text location field.
- Skills mapping logic exists, but the Resume Builder skill section is currently limited in the UI.
- Full source VCs are intentionally not embedded in the LER payload.

## Related Behavior

This document describes the current LearnCard App implementation, not the full LER-RS schema surface area.

The plugin and schema can support additional structures beyond what the Resume Builder currently emits, but the Resume Builder intentionally publishes a narrower, more stable subset.
