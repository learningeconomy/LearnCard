# Consumer Apps integration — October 13, 2026

October 16 rendered follow-up: the [new Apps composition](APPS_REDESIGN.md) is implemented through the existing contracts below: installed/discovery-first hierarchy, original empty artwork, raised static surfaces, intact publisher images and clearer native access review. [Boards and actual captures](design/APPS_RENDERED_BRIEF.md) keep synthetic design metadata distinct from catalog/permission facts. The separately queued [native learning plan](LEARNER_LEARNING_PLAN.md) covers first-party Pathways/Journeys; partner content stays in the browser.

The consumer client uses existing LearnCard accounts, installed-app APIs, consent contracts and sharing protocols. Native screens cover discovery, listing details, installation/removal, agreement review and account Data Sharing. Third-party app content runs inside a separate browser. This is an experimental staging client; administration and developer publishing remain excluded.

## Native boundaries

| Feature      | Existing contract                                                           | Native behavior                                                                                                                                                                                                                     |
| ------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discover     | `browseAppStore`                                                            | Category-filtered paginated catalog; publisher text/icons stay intact. Search walks catalog pages before local filtering. Only actual promotion flags produce a featured card.                                                      |
| My apps      | `getInstalledApps`, `installApp`, `uninstallApp`                            | Native installed list and open/remove controls. All installed pages are read to avoid falsely offering Get for a later-page installation. Server age/guardian checks remain authoritative.                                          |
| Permissions  | `getContract`, `consentToContract`                                          | Actual recipients, required/optional scopes, explicit credential choice and personal values. Optional defaults off. No automatic sharing of all credentials.                                                                        |
| Data Sharing | `getConsentedContracts`, `withdrawConsent`                                  | Actual terms scopes and recipients; withdrawal uses the terms URI. Uninstall does not withdraw consent.                                                                                                                             |
| Shared links | `listShareLinks`, `getShareLink`, `getShareLinkRecovery`, `revokeShareLink` | Owned metadata, copy/share and stop. Only active/finalized/unexpired links are shareable. Get returns an owner-status envelope; read its `found.share` before decrypting recovery. Pending changes are never reported as completed. |
| App content  | Catalog launch type and URL/contract                                        | Separate nonpersistent WKWebView. Embedded apps get a local trusted parent and actual partner iframe; direct/second-screen/consent redirects and résumé stay within a top-level browser.                                            |

`ConsumerAppsStore` discards late account-generation responses. Account background/sign-out locks this store and disposes the account host before asynchronous cleanup. `AccountCommandQueue` serializes the single WK account command channel, bounds waiting requests and removes cancelled waiters. Response decoding handles scalar Bool and optional/null replies as well as object payloads.

The app browser never loads the account SDK. The parent accepts only `LEARNCARD_V1` messages from the exact partner iframe WindowProxy and configured HTTPS origin; native requires a trusted main-frame callback. Identity/consent requests are single-flight and de-duplicated. Reload/close/background cancels pending work. HTTPS URLs with embedded credentials, local domains or numeric addresses are rejected. An explicit web-page fallback handles apps whose framing policy prevents embedding; this mode has no native partner bridge.

## Agreement interoperability

A session-only review token binds the listing and the visible contract. Permission sets, complete sorted audience, audience version, expiry, timestamps and displayed purpose are rechecked before approval and after encryption. Native encryption retains signed originals, copies only explicitly selected full credentials to the complete audience, and records audience-keyed shared URI caches using the same semantics as web consent. A missing selection fails instead of silently dropping a credential.

Required scopes remain enabled; optional defaults start off even if the contract suggests `defaultEnabled`. Personal fields start empty. Anonymous/redacted credential sharing is deferred: this slice retains full signed contents and refuses anonymous decisions rather than promising redaction. Required read-category access can include an empty explicit selection, without `shareAll`. Guardian, front-door and smart-résumé contract flows are blocked until their separate UI exists. The résumé tool itself is web-only. Consent launch uses the existing delegate-presentation protocol with a five-minute expiration; no Firebase session is passed to apps.

## Partner SDK support

- `GET_SYNC_STATUS`: the native bridge is ready, with no background credential-export work implied.
- `REQUEST_IDENTITY`: native approval followed by a domain/challenge-bound account proof and public profile subset. Private email/DOB/Firebase tokens and signing keys are not included.
- `REQUEST_CONSENT`: native review of this listing's configured contract only. Requests for arbitrary contracts or automatic redirect-after-consent are refused.
- `APP_EVENT`: existing listing-scoped SDK/server events; template credential offers trigger an Inbox review affordance. AI-session creation and learner-context events are deferred. Server ownership/template/permission gates remain authoritative.
- Other partner actions (raw `SEND_CREDENTIAL`, credential requests, template-authoring/client issuance, LearnCard feature navigation and direct learner-context requests): explicit `LC_UNSUPPORTED_ACTION`; no fabricated success or automatic credential disclosure.

Sample-mode browser exercises the real PartnerConnect class in an iframe with synthetic services. It never contacts an external app or acts on a live account. Published apps may rely on deferred actions; these need app-by-app compatibility work. Browser cookies are nonpersistent, so web-only tools can require their own web sign-in.

## Native localization

Apple String Catalog (`localization/Localizable.xcstrings`) is canonical. `prepare-localization.ts` validates the four locales and placeholders and emits ignored `.strings`/`.stringsdict` resources plus an English literal lookup for SwiftPM and the app. Reused web translations are recorded in `WEB_SOURCES.json`; Paraglide continues to compile web translations, not Swift views.

English/Spanish/French/Arabic cover Apps, consent, Data Sharing, browser/language controls and selected existing navigation/account labels. Native language preference changes locale and RTL direction without replacing account state. Arabic has all six plural categories. Models, permission IDs, test identifiers, app names and credential prose stay stable/untranslated. Existing builder/recovery/dashboard body copy is partially translated and needs migration plus human translation review.

## Follow-up scope

1. Native **AI career Pathways** — the current `/ai/pathways` feature. User confirmed this meaning; newer Journeys `/pathways` needs separate scope confirmation.
2. Families — the initial native roster/create/edit/guardian-invite slice is described in [FAMILIES_INTEGRATION.md](FAMILIES_INTEGRATION.md). Child creation/switching and guardian approval remain separate account/navigation/permissions work, including server gates and child context.
3. AI Sessions and native learner-context synchronization — its own credentials and session feature.
4. Résumé builder stays web-only in the in-app browser.
5. Continue visual iteration, migrate remaining existing-screen copy, and validate real partner actions on staging with dedicated test data.

## Validation boundaries

Automated coverage uses public/synthetic fixtures and the real SDK client/crypto where applicable. The public staging catalog has been read; it includes developer/test listings and localhost entries, which are not launchable here. Account-backed installations, consent publication/withdrawal and partner event mutations have not been run against the user's real staging account by the agent. Local UI tests exercise the same native screens and services with synthetic boundaries, and CI independently checks iOS credential outputs with the web SDK. See TESTING.md and the workflow results for execution evidence.
