# Native career exploration — October 20, 2026

**Apps → Keep learning → Explore careers** adds a learner destination beside Skills & goals. It uses existing category artwork, flat reading panels, native typography and shared heading rays. Home / Passport / Inbox / Apps remain the four main tabs.

## What learners can do

- Enter a subject, interest or occupation and explicitly search. Search is not run for every keystroke. Suggested starting words are ordinary searches, not personalized recommendations.
- Open a returned occupation to read its description, up to five provider-ranked skills, up to six work activities and supplied education/experience/training context. Missing sections are omitted. These occupational skills are not assessments of the learner.
- Explicitly find related training programs. The provider returns U.S. information; the screen identifies its coverage and notes that source descriptions may be English. School information is shown only when supplied. A valid HTTPS school destination opens the system browser sheet when tapped; it does not install a partner app or transfer credential context.
- Review a proposed personal goal in the existing native goal editor. The occupation title is an editable suggestion in the input, not an automatic save. Long suggestions must be edited to the existing goal limit. Add and Save are explicit; the existing draft/discard/retry/unknown-field/sharing behavior remains authoritative.

First visit, successful empty search, failed search, unavailable provider, disabled-by-choice/age, resource failure/retry and malformed partial program information have distinct treatments. Failed searches retain the last successful results under their original query heading. Account lock clears queries/results and rejects late replies. Arabic, RTL, Dynamic Type and the shared root tray use the same presentation contract as Skills & goals, including explicit environment inheritance for goal sheets.

## Existing service contract

The web's executable query module is [careerOneStop.ts](../../packages/learn-card-base/src/react-query/queries/careerOneStop.ts), with [response types](../../packages/learn-card-base/src/types/careerOneStop.ts). Its tenant config selects `https://api.learncloud.ai`.

A synthetic read-only probe on October 20 returned HTTP 200 for both existing routes: occupation search returned six detailed records including Photographers; training-program lookup returned the provider's school-program envelope. No personal account data, credentials or private documents were sent in those probes. This establishes current response shape and availability, not a service uptime guarantee or server implementation audit.

| Operation | Existing route/body                                                 | Native boundary                                                                                                      |
| --------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Search    | `POST /insights/occupations` with `keyword`, `limit`, `topNDetails` | Trimmed 2–100 UTF-16-unit query; request 12 detailed occupations; validate stable O*NET codes; deduplicate identity. |
| Programs  | `POST /insights/training-programs` with `keyword`                   | Use only the title of a previously returned occupation in this account host; project at most the first ten programs. |

The inspected web contract exposes no verified cursor/offset parameter for these operations. Native therefore identifies bounded first results and asks learners to refine a career search or visit a school's website; it does not fabricate a Load More action. Open Syllabus courses, YouTube/video search, salary/projection claims and AI sessions remain outside this slice.

[careers.ts](account-runtime/careers.ts) performs projection, validation and per-request policy checks. [CareerService.swift](ios/NativeCore/Sources/LearnCardNativeSDK/CareerService.swift) and [CareerStore.swift](ios/NativeCore/Sources/LearnCardNativeSDK/CareerStore.swift) provide typed account-scoped state. [CareerView.swift](ios/Sources/CareerView.swift) renders the native search, detail and resource states. The existing Skills goal editor handles explicit goal commits.

## Age, privacy and transport

Native reads the active profile and authenticated staging preferences before every provider request. It reuses the web's [age decision](../../packages/learn-card-base/src/helpers/aiFeatureGate.ts) and existing AI preference defaults, including explicit approval for an age-qualified child profile. Profile/preference failures cannot enable search. This screen never changes those choices. Personal Skills & goals remains accessible independently of career availability.

The provider routes are public in the inspected web contract and responded without authentication; no account-bound server age enforcement was established. The native client enforces the existing account decision before calling them. Only the entered search words or chosen occupation title are submitted to that service. No personal match calculation, private-document analysis, new consent or AI session is initiated. Goal saves retain the separate [Skills storage/sharing limits](LEARNER_SKILLS.md#sharing-and-ai-boundaries).

The [native transport](ios/NativeCore/Sources/LearnCardNativeSDK/StagingTransport.swift) permits only the two exact provider paths, POST, no query string, and account-host main-frame calls. Authorization, cookies, Firebase tokens and tenant headers are excluded from these provider requests. Redirect rejection, existing response/request bounds and ephemeral session configuration remain. This is a narrowly typed destination, not an arbitrary HTTP proxy. The existing account API allowlist separately gains the authenticated preferences read.

## Verification and remaining queue

See [the current test record](TESTING.md) and [native design evidence](design/LEARNER_SKILLS_BRIEF.md). Demo screenshots use explicitly labeled in-memory fixtures, not live career recommendations or personal account data.

Safe self-assessed skill selection/editing is the next independent slice: retain usable prior records through uncertain Boost/send/index replacement and provide supported framework selection with explicit self-assessed proficiency. Framework authoring remains excluded. Automatic profile-to-contract/insight refresh, expanded provider integrations, real web/native goal-write round trips, Journeys shared persistence/dispatch, Sessions/Insights and organizational workspaces retain their existing checkpoints.
