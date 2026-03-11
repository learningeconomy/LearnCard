# Resume Builder LER-RS Mapping

This page documents how the LearnCard App Resume Builder maps client-side data into the LER-RS credential payload created by `createLerRecord`.

## Personal Details Mapping

| Resume Builder field | LER-RS target |
| --- | --- |
| `name` | `person.name.given`, `person.name.family`, `person.name.formattedName` |
| `email` | `communication.email[].address` |
| `phone` | `communication.phone[].formattedNumber` |
| `location` | `communication.address[].formattedAddress` |
| `website` | `communication.web[]` (`{ url, name: "Website" }`) |
| `linkedIn` | `communication.social[]` (`{ uri, name: "LinkedIn" }`) |
| `career` | `narratives[]` (`"Professional Title"`) |
| `summary` | `narratives[]` (`"Professional Summary"`) |

## Credential Category Mapping

| Resume Builder category | LER-RS target |
| --- | --- |
| `Work History` | `employmentHistories[]` |
| `Learning History` | `educationAndLearnings[]` |
| `Social Badge` | `certifications[]` |
| `Achievement` | `certifications[]` |
| `Accomplishment` | `certifications[]` |
| `Accommodation` | `certifications[]` |

Each mapped item includes source credential evidence using `verifications` (derived from selected source VCs).

## Attachments Mapping

The generated PDF is stored in LER-RS `attachments[]` as an external URL reference.

- `url`: public PDF URL
- `descriptions`: includes generated timestamp and SHA-256 hash

## Respecting Hidden Fields

If a personal detail is hidden in the Resume Builder UI, it is excluded from the issued LER-RS payload.

## Known Gaps

- `thumbnail` is not mapped.
- Structured address components (`line`, `city`, `postalCode`, `countryCode`) are not currently parsed from the free-form location input.
- Skills mapping logic exists, but the Resume Builder skill section is currently disabled in the UI.
