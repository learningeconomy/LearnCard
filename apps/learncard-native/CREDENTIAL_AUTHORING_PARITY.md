# Credential category, type and format parity

October 16, 2026. The native creator was audited against upstream web commit [`c7df5938ca9245227d561c036dc7db8b80c240be`](https://github.com/learningeconomy/LearnCard/tree/c7df5938ca9245227d561c036dc7db8b80c240be). Its three legacy categories and seven-item “Format” menu mixed three different concepts. The native sheets now keep them separate.

| Choice          | Meaning                                       | Examples                           |
| --------------- | --------------------------------------------- | ---------------------------------- |
| Category        | Where the credential belongs in Collection    | Portfolio, Qualifications, Studies |
| Credential type | What is being recognized within that category | Project, License, Course           |
| Format          | How the credential is presented               | Badge, Award, Certificate, Media   |

## Web-supported authoring scope

The regular web creator offers these eight categories. Native uses the same labels, icons and colors as Collection, while persisting the canonical web values.

| Native label   | Canonical stored category | Example types                                          |
| -------------- | ------------------------- | ------------------------------------------------------ |
| Badges         | `Social Badge`            | Risk Taker, Team Player, Star                          |
| Achievements   | `Achievement`             | Degree, Certificate, Attendance                        |
| Qualifications | `Qualifications`          | License, Certification, Apprenticeship Certificate     |
| Studies        | `Learning History`        | Course, Class, Workshop                                |
| Portfolio      | `Accomplishment`          | Project, Artwork, Software                             |
| Assistance     | `Accommodation`           | Permission Slip, Exam Adjustments, Mobility Assistance |
| Experiences    | `Work History`            | Job, Internship, Volunteering                          |
| IDs            | `ID`                      | School ID, Employer ID, Library Card                   |

There are **115 distinct standard types** in the audited web category lists. The duplicate Research Project entry is deduplicated. Type names retain the web's exact wire values, including `ext:` values; translated UI labels never determine storage. All native labels/descriptions have en/es/fr/ar translations.

Collection also browses Skills and AI-generated records that the regular web creator does not offer as manual authoring categories. Family creation remains in Families. Those entries are not added to the generic creator merely because they are visible as browse filters. No new family/AI service or authorization behavior is introduced.

The web visual-format menu offers **Badge, Award, Certificate and Media**. Course, Skill/Competency, Membership, License and MicroCredential are not visual formats. IDs use a fixed `id` presentation. The web has a separate `course` presentation branch, but its regular category picker uses Learning History; native does not invent a Course format choice for Studies. Portfolio starts with Media; other newly chosen non-ID categories start with Certificate, matching the web category-switch defaults. Changing only a type within the current native category retains the chosen format.

## Native interaction

Category opens the existing designed bottom sheet, with all eight illustrated rows. Tapping one opens its searchable, localized type list. Selecting a type commits both choices and closes the sheet. Back/Cancel before selection leaves the draft unchanged. Search matches the translated title and original web title. The category tile and review state show the selected type explicitly.

Format opens its own designed list. Its choices do not recategorize the credential or change the achievement type. IDs show only their dedicated card format. Phone layouts keep the two selector tiles side by side when space permits; accessibility layouts stack and all sheets inherit language, RTL and Dynamic Type. Format changes adapt the lightweight native artwork window; complete web presentation layouts and all ID appearance fields are not reproduced in this pass.

Required title/description, photo preparation, optional evidence/date fields, recipient choice, review, draft cancellation and send/create behavior remain. Category/type/format edits change the request identity. The initial draft is Achievements / Certificate type with the existing Badge visual presentation. No credential is created by browsing these choices.

## Saved-data contract

One explicit category now survives the whole create flow:

- Swift `CredentialDraft.category`, `achievementType` and `displayType` encode separately. Its legacy `kind` remains for old callers and read compatibility.
- The runtime validates category/type membership and allowed formats before network mutation. Old three-kind callers retain their existing fallback contract; invalid or specialized manual categories are refused.
- `credentialSubject.achievement.achievementType` stores the type, and `tag: ["lc:category:<canonical category>"]` preserves the chosen category in signed data.
- Root `display.displayType` and the category's Colorful background are signed using the existing Boost context. IDs also use the existing BoostID context/type.
- `createBoost` metadata carries the same canonical category and the achievement type. Self-claim indexing uses that same category; Portfolio and Qualifications no longer collapse into Achievement.
- For Media with selected artwork, the cover is also signed as `EvidenceFile` with `genre: "photo"` and `fileType: "image/jpeg"`, matching the web media reader. Existing supporting links remain present. No cover evidence is invented without an image.

The current creation receipts are still in-memory; this work does not add a durable crash/uncertain-write journal. It does not publish a live test credential, upload a real photo, or migrate existing records.

## Shared catalog and upstream review

`ios/NativeCore/Sources/LearnCardNativeCore/Resources/credential-authoring.json` is a committed audited snapshot, loaded by Swift and imported by the bundled JavaScript. It records its source commit and file paths. No Paraglide or web UI runs in native views. Builds do not fetch Git or require upstream refs.

To deliberately refresh after reviewing upstream changes:

```bash
git fetch origin main
bun apps/learncard-native/scripts/sync-authoring-catalog.ts --ref origin/main
```

The sync script reads literal metadata with the TypeScript parser; it never executes imported React code. A changed category scope requires review. Update native translations, rules and tests when the snapshot changes. The source files are:

- Web `components/boost/boost-options/boostOptions.ts`: available categories and category-to-subtype lists.
- Web `BoostCMS.tsx`: category changes, defaults and display-selector visibility.
- Web `BoostCMSDisplayTypeSelectorModal.tsx` and `components/boost/boost.ts`: the four selectable visual formats and stored values.
- Shared `components/IssueVC/constants.ts`: achievement types and Qualifications options.
- Shared `react-query/mutations/boosts.ts`, `components/boost/boost.ts` and VC templates: metadata, display and evidence serialization.

User-defined custom types, broader optional-field/ID appearance parity, rubric/alignment controls, lifecycle hardening of uncertain creation writes and dedicated live create/send/upload/web-view validation remain separate work. This aligns regular categories, standard types, format choices and serialization; it does not claim complete web creator feature parity.

See [the creator contract](CREDENTIAL_BUILDER.md), [category display compatibility](CATEGORY_PARITY.md), [test evidence](TESTING.md) and [current native screenshots](design/CREDENTIAL_AUTHORING_BRIEF.md).
