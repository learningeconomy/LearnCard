# Native credential details

October 17–18, 2026. Preserve the rendered credential hero. Separate a compact verification panel, About, credential information and any supplied optional sections. Ordinary reading panels are flat; the credential remains the raised object. Body text uses subheadline scale, section titles use headline scale, and metadata uses secondary labels with stronger values.

## Verification scope and revocation

The signature badge remains separate from lifecycle and issuer trust. `verifyCredential` with `checks: ['proof']` yields the structured `signatureState`: `verified`, `notVerified` or `unavailable`. Never derive success from the legacy English summary. Issuer trust remains unchecked; unsigned local samples keep their separate label.

Opening a signed credential detail makes one read-only `credentialStatus` command for its cached original URI. The detail remains usable while Checking revocation is shown. The command prefers `getMyCredentialLifecycleStatuses({ uris: [uri] })`, the same authenticated holder status used by web. Known network records return active/revoked/suspended, including legacy records without a status list. Omitted records, an older deployment or a failed request fall back to the SDK's original-credential proof check followed by `credentialStatus` verification. No status reads are added to every Passport snapshot.

The fallback binds structured results to the original entry type, purpose, list URL and index. It supports BitstringStatusListEntry, StatusList2021Entry and legacy RevocationList2020Status descriptors, including inner CertifiedBoost status metadata. A confirmed set revocation bit takes precedence over suspension. Active requires all supplied entries to have matching, successful supported results; it is scoped to the purposes actually checked. Missing, unsupported, partial, malformed, offline, timeout and proof-failure outcomes do not become active or revoked. Human-readable verification errors never select a lifecycle state.

Native status UI distinguishes Not revoked, Not suspended, Not revoked or suspended, Credential revoked, Credential suspended, No status information and Status unavailable. Successful results show the source and localized check time. Check again reads current status; a failed retry keeps the last confirmed status/date with a visible stale-result notice. Suspension can return to active after a successful recheck. The detail owns transient state; it is not a persisted cross-account status cache. Cancelled reads do not publish a late result.

Network status is a LearnCard network record, not an issuer-trust attestation. The status-list fallback uses the bundled verifier and the existing staging-only transport policy: external hosts are not newly permitted, so unsupported/unreachable external lists remain unavailable. Each remote attempt is bounded at eight seconds. Expiry is displayed independently in credential information. This pass does not remove, hide or mutate credentials, disable original-data sharing/export, change acceptance rules, or add issuer revocation controls. Endorsements and issuer trust remain separate follow-ups.

## Additional information

`account-runtime/credential-details.ts` makes a read-only projection without rewriting the signed original:

- Achievement criteria narrative and reference URL, including multiple subjects/achievements and legacy badge narrative.
- Alignment name, description, framework, code and reference URL.
- Evidence and attachments with names, descriptions and links.
- Field of study, role, term, credits, activity dates and expiration (`validUntil` / legacy `expirationDate`).
- Result values, including zero, with inline or referenced achievement result descriptions.

Only supplied sections appear. Plain text is not executed as markup. Reference links accept HTTP/HTTPS URLs without embedded credentials; other references remain noninteractive. Unknown/malformed optional entries do not become fabricated facts. The original signed payload remains intact for sharing/export. Optional dates require complete ISO timestamps; date-only or malformed strings are not assigned an invented timezone.

Paragraphs show up to four lines with Show more only when their measured content is actually truncated, including enlarged text. Each optional list initially shows up to three items and can reveal the rest. No extra network reads or writes occur when expanding these sections. The existing original credential export remains an advanced option rather than a replacement for these fields.

## Primary actions and sharing

A measured footer on the detail scroll view keeps the primary action available above the root navigation tray. Offers keep Add to Passport, reusable creations keep Send, and signed personal credentials use **Share**. Unsigned samples preserve their demo actions. The root tray height contract remains unchanged. Signed JSON export moves into More options with its full-data disclosure.

Share opens a focused review for exactly this one credential. It does not open the multi-selection picker or publish on presentation of the sheet. Creating a link explicitly invokes the existing native `share()` boundary with one ID and a stable request ID. Retry fingerprints use the meaningful fields in canonical key order so Foundation/WebKit dictionary ordering cannot change an otherwise identical request. That existing web-compatible flow preserves complete original credentials and public endorsements inside an encrypted holder presentation, with a 30-day expiry and owner controls in Data Sharing. It uses the modern encrypted presentation-link protocol already in native, rather than introducing another copy of web's older seed/PIN sharing implementation.

After successful publication, the same complete URL is used for the native QR, Copy link and iOS share sheet, including its fragment viewing key. A pending publication exposes no QR/URL and offers Check link status using the same operation. A failure keeps the credential and explicit retry. Closing/reopening the sheet on the same detail screen retains the ready link instead of publishing again. Leaving/re-entering the detail screen starts a new review; cross-launch publication recovery remains outside this UI pass.

Unsigned demo credentials prepare sample text and never publish a real link. QR/retry/pending UI checks use an explicitly isolated service and an `example.invalid` URL. They do not prove live publication or recipient behavior on a real account. HTTPS presentation links open the existing web recipient viewer; native recipient presentation-link intake is separate from QR credential claiming.

## Follow-up: endorsements

The user explicitly split endorsements into a later feature. Plan native counts and lists, source-credential binding, individual endorsement details, public/private visibility, requests and response routing together. Keep issuer trust, credential signatures and endorsements distinct. Existing sharing's inclusion of public endorsements is preserved; this pass adds no request/accept/visibility mutation.

## Verification

See [TESTING](TESTING.md) for actual runs and installed-build evidence. Core tests check old/new wire compatibility, fractional dates and preservation of the original payload. Runtime tests compare the projection with immutable originals and exercise the actual SDK proof check and existing encrypted presentation manifest. Native UI checks cover expanded source fields, pinned actions, secondary export, failure/pending/ready/reopen, sample sharing and Arabic accessibility text.

## Actual native screens

The images below document the initial detail/share pass, before the separate lifecycle panel. Updated physical scroll/retry captures are pending the Mac unlock; see the current verification record in TESTING.

These captures use isolated display fixtures and a nonfunctional `example.invalid` presentation URL. The green badge exercises a supplied signature-result fixture; it is not a claim about a real account. Real SDK cryptography is checked separately in the runtime tests.

| Details                                                                                               | QR on a 375-point phone                                                                            |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| ![Native details with scoped signature badge and primary Share](design/credential-details-native.png) | ![Native single-credential presentation QR fixture](design/credential-share-qr-compact-native.png) |

[Expanded alignment references](design/credential-alignments-native.png). Native screenshot QR decoding confirms the exact expected URL and fragment key at both phone sizes.
