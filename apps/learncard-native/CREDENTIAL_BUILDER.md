# Native credential creator

The October 15 visual pass follows the [generated design reference](design/CREDENTIAL_BUILDER_BRIEF.md) and [native design system](design/DESIGN_SYSTEM.md). It changes the presentation of Design → Recipient → Review, retaining the existing account-runtime builder.

## Interaction contract

- Design shows a live category-colored preview, original bold category artwork or the selected local photo, labeled title/description fields with real character limits, native format/category action sheets and expandable optional criteria.
- Continue remains in a bottom action tray, responds to required fields/limits and photo preparation, and dismisses the keyboard. Back preserves the whole draft. Each step opens at the top rather than inheriting the previous form's scroll position.
- Myself adds the issued result to My credentials. Someone else requires a member selected from the account search. Cancelling the member picker does not confirm an unidentified recipient. Changing search text removes stale results; stale replies cannot replace a newer query's results or error state.
- Review shows the actual title, description, format/category, criteria, recipient, delivery destination and reusable-creation behavior. Selected artwork is disclosed as publicly accessible by link before upload. Review and Back do not publish anything.
- Create retains `CredentialDraft.requestID`, artwork-upload retry reuse, the existing SDK issuance/delivery and explicit confirmation. UI editing and dismissal are disabled during creation. No new account mutation is performed by opening the flow or selecting a photo.
- En/es/fr/ar copy lives in the String Catalog. Published member names and credential content remain verbatim. The creator and nested picker explicitly apply language/RTL and review Dynamic Type inside their own presentation roots.
- Accessibility sizes stack preview content and selector tiles. The bright category panels keep fixed navy text in either appearance. Ordinary form transitions respect Reduce Motion; account splash motion does not run here.

The three legacy authoring categories and seven formats are unchanged. Full semantic-category authoring remains a separate builder/SDK change; this does not regress existing read/display parity for Portfolio and Qualifications.

## Validation

See [TESTING](TESTING.md) for the focused existing issuance/action-sheet checks, draft/back/recipient-cancel/photo-picker checks and actual Arabic accessibility/dark presentation review. All automated authoring checks use unsigned demo data in the separate checks simulator. Live create/send/photo-upload behavior still requires an intentional manual staging validation.
