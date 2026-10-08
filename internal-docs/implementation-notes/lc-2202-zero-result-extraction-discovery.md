# LC-2202: Zero-result credential extraction discovery

Date: 2026-10-08. Scope: discovery and implementation recommendations, not a product change.
Ticket: [LC-2202](https://welibrary.atlassian.net/browse/LC-2202).

## Decision

Preserve the original file independently of structured extraction, reuse the existing
`RawArtifactCredential`, and distinguish extraction outcome from persistence outcome. Make the
saved document accessible without inventing an achievement or implying third-party verification.
Add bounded, consent-gated operational diagnostics across the LearnCard / AI Passport boundary.

The specific Maya Thompson incident remains unexplained. The current response cannot identify
whether OCR, validation, model extraction, or a different deployed implementation caused it.
An empty result is not evidence that the learner's resume lacks useful content.

## Evidence boundary

- LearnCard source: `d031fa1025f139ba20241b77b58aa7a039584b35`.
- Adjacent AI Passport source: `40d8cd9b918f73ca45f43468b6a450752f80a08b` in
  `../AI-Passport`; inspected read-only. Its deployed parity and active model configuration are
  **unverified**. LearnCard calls the tenant-configured AI service, not this checkout directly.
- Ticket says the file was saved, zero credentials were reported, and Duncan could not reproduce
  on production. Those observations are accepted; no attempt was made to reconfirm them.
- The tester screenshot redirected to BetaTesting login. Both the Atlassian API-host and site-host
  attachment URLs returned HTTP 403. The PDF contents were not accessible through these tools.
  No matching fictional resume asset was found in the app, tests, or adjacent AI Passport source.
- Runtime evidence below exercises real local control flow with synthetic external boundaries.
  It does not reproduce the PDF, OCR/model behavior, a deployed HTTP service, actual wallet
  cryptography, or the visual UI. No production data or provider requests were used.

## Current flow and failure boundaries

### LearnCard

1. `useUploadFile.getFile` creates a raw artifact containing the file bytes; this is in-memory
   preparation, not a confirmed save (`apps/learn-card-app/src/hooks/useUploadFile.tsx:167-197`).
2. `useUploadFileMutation` posts `{file, fileType}` through `aiPassportFetch` to
   `/credentials/parse-file`. It reads JSON and checks the HTTP status, but does not validate the
   successful body shape (`packages/learn-card-base/src/react-query/mutations/ai-passport.ts:170-208`).
3. `fetchParsedCredentials` uses `response?.vcs ?? []`, so a missing `vcs` field looks like a valid
   empty response (`useUploadFile.tsx:467-489`). Non-JSON / non-2xx failures reject instead.
4. Resume manager presents nonempty results for review. Empty results **and extraction exceptions**
   attempt to save the raw file; the exception branch also shows a stripped raw error message
   (`components/learncard/checklist/checklist-steps/CheckListUploadResume.tsx:80-120`, under the app's
   `src/`). Other `parseFile` callers do not have that same exception fallback.
5. `saveFile` signs the artifact, uploads it encrypted, then adds or updates its LearnCloud index
   record. It catches storage errors without returning a failure or rethrowing
   (`useUploadFile.tsx:427-462`). Callers can therefore report **saved when persistence failed**.
6. `storeSelectedCredentials` uses the number selected as the extraction count. Selecting none
   after successful extraction produces “No credentials could be extracted”, even though
   extraction succeeded (`useUploadFile.tsx:528-625`). Keep extracted, selected, and stored counts
   separate.
7. Multi-file `parseFiles` catches individual failures and continues; its total-zero message can
   also cover failed files, not only successful empty responses (`useUploadFile.tsx:719-870`).

The current toast already differentiates “Resume … saved” from “No credentials could be extracted”,
but it gives no reason or next action, is not a durable outcome view, and is not backed by a reliable
persistence result. A saved-file toast alone cannot prove storage succeeded.

### AI Passport local snapshot

Paths below are relative to `../AI-Passport/services/ai-passport-backend/src/`.

| Boundary                                                                         | Current behavior                                                                                                              | What it establishes                                            |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Input (`credentials/service.ts:837-854`)                                         | Rejects malformed base64 input and approximate size over 4 MiB                                                                | Input rejection, not zero-result success                       |
| Text extraction (`helpers/file.helpers.ts:116-181`)                              | PDF text layer; OCR on parser failure or at most 20 non-whitespace characters; images use OCR; TXT/DOCX have separate readers | Reading path can fail or yield empty text                      |
| Validation (`helpers/file.helpers.ts:184-218`, `credentials/service.ts:866-873`) | AI checks the first 2,000 text characters; rejects invalid or confidence below 0.7                                            | Validation decision, not proof of insufficient content         |
| Structured extraction (`credentials/service.ts:875-902`)                         | AI call with a per-type schema; exceptions reject; absent array properties default to empty                                   | Schema-valid output may still have no items                    |
| Credential construction (`credentials/service.ts:955-1133`)                      | Loops work, education, certificates; transcript requires courses; diploma requires degree and institution                     | Empty eligible collections produce no credentials              |
| Response (`credentials/service.ts:1135-1140`, `http/server.ts:472-487`)          | Success returns `{text, result, vcs}`; caught parser errors become HTTP 500 `{error}`                                         | Empty success is distinct from thrown failure at this boundary |

The resume validation prompt permits work experience, education **or skills**, while the resume
structured schema asks for work and education. **[INFERENCE]** A skills-only resume can satisfy
validation yet produce no supported credential items. This does not explain the tester's resume.

An empty OCR result is passed to validation without a deterministic empty-text guard. The local
control-flow smoke confirms it can reach an empty result **if** the validator accepts it; whether
an actual model would do so is unverified. A long resume's opening section can also differ from
its later content; the effect of the 2,000-character validation window is an untested hypothesis.

Snapshot model defaults are `gpt-5.6-luna-none` for formatting and `gpt-5.6-sol-medium` for vision
OCR (`constants/env.ts:90-93`); environment overrides exist. Capture effective deployed versions
rather than assuming these defaults or package versions describe the incident.

## Does the original artifact already become a usable credential?

**Technically yes; learner-facing access is incomplete.**

- `createRawArtifactVC` uses `VerifiableCredential` + `RawArtifactCredential`, issuer and subject
  set to the learner, and embedded file bytes/metadata. It contains no achievement assertion
  (`useUploadFile.tsx:895-937`). The save path signs and encrypts it.
- It is indexed under the upload category (`resume`, `certificate`, etc.), not automatically
  added to the ordinary extracted achievement categories. Checklist completion counts those
  artifact records (`packages/learn-card-base/src/react-query/queries/checklist.ts:25-39`).
- Resume manager reads and displays filename, size and type, with update/delete controls; its
  row offers no open/download/share action (`CheckListUploadResume.tsx:122-145,335-382`). This is
  not proof that no other route anywhere can render an artifact.
- Existing shared media rendering accepts `rawArtifact.data` as an attachment and supports
  embedded PDF preview (`packages/learn-card-base/src/helpers/credentialHelpers.ts:1621-1659`;
  `components/CredentialBadge/CredentialMediaBadge.tsx:70-86,140-150` in that package). Reuse it
  rather than introducing a second credential format or storing plaintext file URLs.
- Resume save updates the existing record's URI. An empty/error upload can replace the previously
  indexed resume. The prior bytes' physical retention is unknown; the old artifact is no longer
  reachable through that record. Preserve the current single-resume convention; do not add
  version history as part of this work. Explain replacement and only replace after confirmed save.

## Proposed learner behavior

Use one persistent outcome panel beside the saved document, not competing error/success toasts.
Use normal success styling for confirmed storage, neutral/amber extraction-empty feedback, and
error styling only for failed processing or persistence. Localize copy and follow existing loading,
modal, keyboard, and accessibility conventions.

| Confirmed state                                  | Proposed feedback                                                                   | Next actions                                                        |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| File saved, extraction completed with zero items | “Your file is saved. We couldn't find credentials to add.”                          | Open File, Try Again, Done                                          |
| File saved, extraction failed                    | “Your file is saved. We couldn't process it right now.”                             | Open File, Try Again, Done                                          |
| Extraction succeeded, learner selected none      | “Your file is saved. No credentials were selected.”                                 | Open File, Review Credentials, Done                                 |
| File could not be saved                          | “We couldn't save your file. Please try again.”                                     | Try Again; keep the chosen file available in the current flow       |
| Some files or credentials failed                 | Identify each file's local outcome and accurately count credentials actually stored | Retry only failed processing or saves; leave successful items alone |

“Try Again” reruns extraction on the same saved artifact; it must not duplicate the raw artifact,
replace another resume, or automatically store model-generated achievements. Successful retries
still go through the existing learner review. No automatic retries of model extraction are proposed.
If persistence failed, retry that stage before claiming preservation; keep the existing indexed
resume intact. Show contextual processing feedback and prevent concurrent duplicate actions.

Label the fallback **Uploaded Document** with **Provided by you · Not verified by an issuer**.
Retain the learner as issuer/subject, original bytes, original local filename, type and size.
Do not generate degree, institution, achievement, endorsement, skills, or issuer-verification claims.
Make it reopenable from the upload manager using existing attachment rendering; offer local download
where supported. Keep sharing explicit and use existing encrypted/consented sharing mechanisms
only after verifying they support this artifact type. Do not pretend a normal achievement card or
third-party verification exists. File-only preservation requires no new credential schema.

## Proposed privacy-conscious diagnostics

Introduce a typed, allowlisted event at each terminal processing boundary. Track extraction and
storage separately so an extraction-empty event is not a save-failed or learner-deselected event.

- **Stages:** input, text extraction, content validation, structured extraction, credential
  construction, artifact persistence, selected-credential persistence.
- **Outcomes:** succeeded, zero results, failed; explicit stable codes such as `INPUT_INVALID`,
  `READ_FAILED`, `NO_READABLE_TEXT`, `CONTENT_REJECTED`, `MODEL_FAILED`, `RESPONSE_INVALID`,
  `ZERO_STRUCTURED_ITEMS`, `ARTIFACT_SAVE_FAILED`, `CREDENTIAL_SAVE_FAILED`. They describe observed
  boundaries, not inferred causes. Keep learner deselection out of extraction failures.
- **Metadata:** schema version; recognized MIME/file kind; bounded size bucket and duration;
  extracted/selected/stored item counts; HTTP status if available; effective parser build,
  prompt/schema revision and effective model IDs from server-controlled values.
- **Correlation:** one random operation UUID and a new attempt UUID for each explicit retry,
  passed client-to-server and returned on success/error. Link attempts only within the operation.
  Bound/validate IDs and enums; never derive IDs from DID, filename, document hash or user identity.
  Record whether a user-triggered retry subsequently succeeds, without cross-document tracking.
- **Exclude:** file bytes/base64/URLs, filenames, extracted text, model prompts/results, validation
  reasons, credentials, personal details, DIDs/auth headers, arbitrary exceptions/stacks/messages.
  Exact file size is unnecessary for routine diagnostics; buckets reduce fingerprinting risk.
- **Consent and retention:** remote client diagnostics honor `bugReportsEnabled`; use the existing
  authenticated-adult diagnostic eligibility gate for feedback attachments. Never bypass minor or
  opt-out restrictions. Carry an explicit eligibility signal to backend diagnostic emission rather
  than assuming authenticated requests opted in. Proposed operational retention: 30 days, restricted
  engineering access, no source-artifact retention in telemetry; approve policy before rollout.
- **Optional investigation sharing:** separate affirmative consent describing the exact artifact,
  recipient, purpose, retention and deletion path. Default off; no automatic screenshot/file
  attachment, no silent conversion of AI-processing consent into investigation consent. Existing
  AI processing still receives the document; metadata-only diagnostics do not change that fact.

Reuse `getLogger`, but construct the safe payload **before** calling it. General key/pattern-based
scrubbing is not a guarantee that arbitrary provider errors or document text will be removed.
`logger.info` produces Sentry breadcrumbs, not independently countable outcome events; choose
an existing consent-gated event transport for aggregate diagnostics rather than treating breadcrumbs
as metrics or misclassifying normal empty results as exceptions.

The strict feedback buffer currently permits only one static event message and bounded
boolean/count/status fields; it would strip proposed stages, versions and IDs
(`packages/learn-card-base/src/logging/diagnosticLogBuffer.ts:45-122`). Extend it narrowly with
validated operational fields if those should accompany feedback; do not relax arbitrary-string
redaction or use `allowPii`. Backend raw `console.error` calls and returned model validation reasons
also need boundary-specific safe-code mapping (`credentials/service.ts:857-889`).

These signals can distinguish failed reading, zero readable text, validation rejection, model
failure, contract-invalid response and genuine empty structured output. They **cannot reliably
prove** insufficient learning content versus a model defect. Keep cause unknown unless consented
artifact review or a controlled reproduction supplies evidence.

## Scoped implementation recommendations

Implement these as coherent changes after the discovery decisions are accepted:

1. **Accurate outcome contract and persistence:** in AI Passport, report typed terminal stage,
   safe code, counts, correlation IDs and effective versions. In `useUploadFileMutation`, validate
   the successful response and preserve safe status/stage data. In `useUploadFile`, return/propagate
   explicit persistence failures; distinguish extracted, selected and stored counts. Apply to
   resume, certificate, transcript, diploma and partial batches. Do not change the extraction
   model/prompt based on an unexplained incident. Do not move raw `text`/`result` into diagnostics.
2. **Document preservation and access:** reuse the existing signed/encrypted raw artifact and
   upload-category index. Confirm artifact save independently of extraction, without silently
   replacing a prior resume on failed persistence. Keep review before storing extracted credentials.
   Add the durable outcome panel, safe copy, reopen/download action and user-triggered retry using
   the existing manager/media surfaces. No guessed achievement category or new storage service.
3. **Bounded diagnostics:** add allowlisted, consent-gated terminal events on both services and
   operation-scoped retry correlation. Verify gates and retention before enabling collection.
   This requires an AI Passport change as well as a LearnCard change; a frontend-only event cannot
   explain OCR/validation/model branches that the current API does not expose.

Acceptance coverage for implementation should include: empty success vs rejected processing;
malformed/missing successful `vcs`; unreadable/empty text; validation rejection; nonempty review;
select-none; signing/upload/index failure; existing-resume replacement; per-file partial outcomes;
reopen/download of preserved bytes; successful retry without duplicate storage; opt-out/minor gates;
and arbitrary personal strings in provider errors that must never reach telemetry or user copy.

## Executed investigation checks

Both throwaway harnesses ran with `node --input-type=commonjs` via stdin, using
`typescript.transpileModule` to load the existing source. No test or scaffold files were added.

| Harness                                                                                | Exercised scenarios                                                                                                                                  | Observed result                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actual upload hook, mounted with React + Happy DOM; synthetic wallet/parser boundaries | Empty response; missing `vcs`; extraction exception; artifact upload failure; select-none; existing resume                                           | All six assertions passed. Empty/missing output saved the artifact; `parseFile` exception did not save; upload failure still produced a saved toast; select-none produced extraction-empty copy; existing resume used index update |
| Actual adjacent `parseFile`; synthetic reader/validator/model/credential factory       | Empty work/education; one work item; empty text accepted by validator; reader failure; invalid validation; confidence 0.69; structured model failure | All seven assertions passed. First/third returned zero VCs; work item constructed a learner-issued VC; failures rejected at their expected stage                                                                                   |

The backend route's HTTP 200/500 mapping was traced in source, not exercised over HTTP.
Visual UI, actual encrypted storage/readback, document preview/download, and production/provider
behavior remain unverified. This discovery changes documentation only: no application tests,
typecheck, lint or build were needed to establish an unchanged product baseline.

## Manual validation plan for implementation

Use a local/staging account eligible for AI features and a synthetic resume; do not submit real
personal documents to diagnostics. Use controllable local AI Passport outputs to isolate boundaries.
The following are **proposed checks, not runs claimed by this discovery**.

1. Return valid `{vcs: []}`. Expect a confirmed saved-document state with separate zero-result
   feedback. Refresh/reopen the manager and open/download the original bytes.
2. Return a reading/model error, then success on manual retry. Expect the artifact preserved,
   friendly stage-specific feedback, retry to enter review, and no duplicate artifact or credentials.
3. Return `{}` as HTTP 200. Expect `RESPONSE_INVALID`, not successful zero extraction.
4. Extract multiple credentials, select none and confirm. Expect “No credentials were selected”,
   not extraction failure. Resume review without rerunning extraction.
5. Fail signing, upload and index add/update separately with a previous resume present. Expect no
   saved claim, no loss of the existing indexed resume, and a retryable local chosen file.
6. Process a mixed batch with success, empty output and rejection. Expect per-file states and
   stored counts; retry only the affected stage/files without duplicating prior successes.
7. With bug reporting disabled or an ineligible/minor account, inspect client and backend telemetry.
   Expect no optional extraction diagnostics. With an eligible opt-in account, verify only allowlisted
   metadata survives, including when a synthetic provider error embeds personal strings.
8. Decline optional artifact sharing. Expect no source bytes or screenshots sent to investigation
   storage. Consent to a synthetic artifact only and verify the stated recipient/retention path.

## Discovery acceptance mapping

| LC-2202 requirement/question                   | Result                                                                                                    |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Identify zero-result paths and known causes    | Local client/backend boundaries traced and smoke-exercised; incident cause explicitly unknown             |
| Privacy-conscious diagnostic approach          | Typed stage/outcome metadata, consent gates, bounded correlation, exclusions and retention proposal above |
| Clear feedback for storage vs extraction       | Confirmed-state feedback table, persistence-error correction and separate selection counts                |
| Determine usable original artifact / fallback  | Existing self-issued encrypted raw artifact established; explicit document access/labeling proposed       |
| Distinguish insufficient content from defects  | Not reliably possible with current responses; proposed signals narrow stages without asserting cause      |
| Required scoped implementation recommendations | Three dependency-ordered changes and behavioral acceptance coverage above                                 |
