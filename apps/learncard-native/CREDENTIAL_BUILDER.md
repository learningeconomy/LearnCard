# Native credential creator

The October 15 visual pass follows the [generated design reference](design/CREDENTIAL_BUILDER_BRIEF.md) and [native design system](design/DESIGN_SYSTEM.md). It refines Design → Recipient → Review and extends the existing account-runtime builder with optional web-compatible details.

## Interaction contract

- Design shows a live category-colored preview, original bold category artwork or the selected local photo, labeled title/description fields with real character limits, designed format/category selection sheets and expandable optional details.
- Continue remains in a bottom action tray, responds to required fields/limits and photo preparation, and dismisses the keyboard. Back preserves the whole draft. Each step opens at the top rather than inheriting the previous form's scroll position.
- Myself adds the issued result to My credentials. Someone else requires a member selected from the account search. Cancelling the member picker does not confirm an unidentified recipient. Changing search text removes stale results; stale replies cannot replace a newer query's results or error state.
- Review shows the actual title, description, format/category, criteria, recipient, delivery destination and reusable-creation behavior. Selected artwork is disclosed as publicly accessible by link before upload. Review and Back do not publish anything.
- Create retains `CredentialDraft.requestID`, artwork-upload retry reuse, the existing SDK issuance/delivery and explicit confirmation. UI editing and dismissal are disabled during creation. No new account mutation is performed by opening the flow or selecting a photo.
- En/es/fr/ar copy lives in the String Catalog. Published member names and credential content remain verbatim. The creator and nested picker explicitly apply language/RTL and review Dynamic Type inside their own presentation roots.
- Accessibility sizes stack preview content and selector tiles. The bright category panels keep fixed navy text in either appearance. Ordinary form transitions respect Reduce Motion; account splash motion does not run here.

The October 16 parity pass replaces the three legacy categories and mixed format/type list with eight web authoring categories, their 115 standard types and four independent visual formats. IDs retain their dedicated format. Category and type are selected together in the designed sheet, with search and cancellation; the selected canonical category survives signing, template metadata and self-claim indexing. See [the audited source, mappings and remaining boundaries](CREDENTIAL_AUTHORING_PARITY.md).

## Validation

See [TESTING](TESTING.md) for the focused issuance/selection-sheet checks, draft/back/recipient-cancel/photo-picker checks and actual Arabic accessibility/dark presentation review. Simulator authoring checks use unsigned demo data in the separate checks simulator; protocol checks issue and verify real signatures with disposable SDK identities. Live create/send/photo-upload behavior still requires an intentional manual staging validation.

## Mockup fidelity and richer details — October 15 follow-up

The user specifically rejected the system `confirmationDialog` bubble and asked to retain the reference's plane, rays and inviting composition. Format and Category now open **custom selection sheets** with illustrated rows, descriptive labels and a clear selected state. Ordinary phone layouts keep both selector tiles side by side; accessibility sizes stack. The step indicator uses connected dots, the Design canvas integrates photo selection and a title shortcut, Recipient has a paper plane and two colored choices, and Review keeps the celebratory card marks. New assets are reproducible editable SVGs in `scripts/prepare-illustrations.ts`, rather than crops of a generated image. The neutral page canvas remains.

More details expands criteria, a criteria link, field of study, role, term, activity start/completion, expiry and up to five supporting links with title/description. Dates open a dedicated calendar sheet with explicit Use/Cancel/Remove actions. Back or collapsing the section preserves fields; cancelling a date does not change it. Review includes every populated optional field before issuance. Expiry includes the chosen local calendar day through 23:59:59; activity dates use the beginning of their local day. Day boundaries use Calendar rather than adding 24 hours across daylight-saving changes.

| Native draft detail         | Signed credential location                                              | Web source                                 |
| --------------------------- | ----------------------------------------------------------------------- | ------------------------------------------ |
| Criteria narrative/link     | `credentialSubject.achievement.criteria.narrative/id`                   | Credential Builder `serializeAchievement`  |
| Field of study              | `credentialSubject.achievement.fieldOfStudy`                            | `serializeAchievement`                     |
| Role / term                 | `credentialSubject.role/term`                                           | `templateToJson` / issue field descriptors |
| Activity start / completion | `credentialSubject.activityStartDate/activityEndDate`                   | `templateToJson` / issue ActivityFields    |
| Expiry                      | Root `validUntil`                                                       | issue advanced options / `templateToJson`  |
| Supporting links            | Root `evidence[]`: URL `id`, `type: ["Evidence"]`, name and description | issue media evidence / `templateToJson`    |

`AccountRuntime.create(draft)` encodes Dates as ISO 8601; default numeric Swift Date coding is not a valid wire value. UI-only evidence UUIDs are omitted. Untouched/blank optional rows do not invent evidence or dates. Both Swift and JavaScript reject invalid web links, embedded URL credentials, excess lengths/counts and reversed activity dates before creation. Evidence belongs at the root, rather than inside the achievement subject, for the web's VC v2/OBv3 contexts. The real SDK signing/proof test verifies that mapping. No new issuer claims, result/rubric controls, arbitrary JSON extensions or backend administration fields are introduced.

Retry fingerprints recursively sort object keys so Foundation/WebKit dictionary order does not make an unchanged draft appear edited. The runtime's creation receipts remain in memory and start after template creation returns; they are not a durable crash or uncertain-write journal. Durable creation reconciliation remains separate hardening work; the claim flow has its own journal.
