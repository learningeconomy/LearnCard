# Pathway-progress testing guide

A practical walkthrough for exercising the pathway-progress reactor
architecture end-to-end. Three layers of confidence, in order from
fastest to most realistic:

1. **Simulator** — deterministic, scripted, zero external dependencies.
2. **Seeded pathway** — visual validation of the architecture in the
   UI, using the AWS Cloud Practitioner demo pathway.
3. **Real-world** — claim an actual boost / finish an actual AI tutor
   session and watch the full pipeline fire.

Every step assumes the dev server is running (`pnpm lc dev ...`) and
you're signed in with any learner DID.

---

## 1. Simulator (console, ~2 min)

The `window.__pathwaysDev` globals expose the full reactor pipeline.
Every simulator publishes through the same `walletEventBus` that
production uses, so a green result here is identical to a successful
real-world flow.

```js
// 1. Start clean
__pathwaysDev.resetAll();

// 2. Seed the AWS demo pathway (learner DID from the auth store)
const pathwayId = __pathwaysDev.seedAws('did:example:alice');

// 3. Confirm the pathway has the new terminations
__pathwaysDev.inspectPathway();
// Expected output (abridged):
//   · [not-started ] Watch: AWS Cloud Essentials — 1 × image
//   · [not-started ] Practice: 5 timed exams … — 5 × text
//   · [not-started ] Deep dive: AI-coached … — self-attest
//   · [not-started ] AI Tutor: IAM deep dive — session on boost:aws-iam-deep-dive
//   · [not-started ] AI Tutor: VPC quick refresher — self-attest
//   · [not-started ] Schedule: book the proctored exam — 1 × image
//   · [not-started ] Earn: AWS Cloud Practitioner credential — requirement (any-of)

// 4. Simulate the terminal VC landing. The `any-of` requirement
//    means EITHER of these will match.
__pathwaysDev.simulateCredentialClaim({
    type: 'AWSCertifiedCloudPractitioner',
    issuer: 'did:web:aws.example',
});
// Console logs:
//   [pathwaysDev] simulateCredentialClaim → { nodeCompletions: 1, outcomeBindings: 1, credentialUri: 'urn:uuid:sim-...' }
// UI: the `CredentialClaimedPathwayCta` modal appears with "This
// credential advanced your work" and a primary "See pathway" CTA.

// 5. Verify the node flipped to completed
__pathwaysDev.inspectPathway();
//   ✓ [completed   ] Earn: AWS Cloud Practitioner credential — requirement (any-of)
// Outcomes: 1 declared, 1 bound

// 6. Simulate the IAM tutor session ending
__pathwaysDev.simulateAiSessionFinish({
    topicUri: 'boost:aws-iam-deep-dive',
    durationSec: 600,  // 10 minutes
});
//   [pathwaysDev] simulateAiSessionFinish → { nodeCompletions: 1, topicUri: '...', threadId: '...' }
//   (No modal — only credential ingests surface the CTA; AI sessions
//    have their own in-chat completion UI.)

// 7. Confirm
__pathwaysDev.inspectPathway();
//   ✓ [completed   ] AI Tutor: IAM deep dive — session on boost:aws-iam-deep-dive
```

### What to watch for

| Behaviour | Where it comes from |
|---|---|
| Modal appears once per credential, not once per match | `PathwayProgressReactorMount` dedupes by `credentialUri` |
| `simulateCredentialClaim` with the same `eventId` twice → only one dispatch | `walletEventBus` dedup by `eventId` |
| `simulateAiSessionFinish` without a `topicUri` → rejected | publisher-side guard in the simulator |
| `simulateCredentialClaim` with a non-matching type → `nodeCompletions: 0` and no modal | `CredentialClaimedPathwayCta` early-returns when `hasProgress === false` |
| Calling the same simulator twice with different `eventId`s → second call shows `already-completed` | idempotent-by-node-status at binder layer |

### Exercising the full DSL

Every leaf requirement kind can be tested from the console. Examples:

```js
// boost-uri match (the other branch of the AWS node's `any-of`)
__pathwaysDev.simulateCredentialClaim({
    boostUri: 'boost:aws-ccp-credential',
    // No `type` needed — the boost-uri matcher ignores it.
});

// ob-achievement match (build a node with `ob-achievement`
// termination first, then)
__pathwaysDev.simulateCredentialClaim({
    achievementId: 'https://badges.example/ach/aws-clf',
});

// ob-alignment match
__pathwaysDev.simulateCredentialClaim({
    alignments: ['https://rsd.example/iam'],
});

// skill-tag match
__pathwaysDev.simulateCredentialClaim({
    tags: ['IAM', 'least-privilege'],
});

// score-threshold match
__pathwaysDev.simulateCredentialClaim({
    type: 'CollegeBoardSATScore',
    credentialSubject: { score: { total: 1450 } },
});
```

### Introspection

```js
// Every dispatch the reactor has recorded this session.
__pathwaysDev.listDispatches();
// → ProgressDispatchRecord[] with eventId, nodeCompletions,
//   outcomeBindings, credentialUri / threadId+topicUri.

// Clear the history (pathway store untouched).
__pathwaysDev.clearDispatches();
```

---

## 2. Seeded pathway (UI, ~5 min)

Once the simulators are green, the same AWS demo pathway gives you a
visual walkthrough of every new termination kind.

```js
__pathwaysDev.resetAll();
__pathwaysDev.seedAws('did:example:alice');
```

Then navigate to `/pathways/today`. Expected state:

- The pathway shows seven nodes. The termination copy for each uses
  the extended view-model:
  - Nodes 1, 2, 6 render a progress ring (existing `count` view).
  - Node 3 renders the "Ready when you are" affordance (`ready` view).
  - **Node 4 renders "Finish the AI tutor session"** — the new
    `external` view triggered by the `session-completed` termination.
  - Node 5 renders "Ready when you are" (`self-attest`, kept as a
    control).
  - **Node 7 renders "Earn a qualifying credential"** — the new
    `external` view triggered by `requirement-satisfied`.

### Visual tests

**Session-completed loop** — click into Node 4 (IAM deep dive):
1. The `AiSessionCard` renders the launch CTA.
2. Tap **Start session** — the modal-over-map launches the first-
   party tutor for `boost:aws-iam-deep-dive`.
3. Click **Finish Session** in the chat.
4. Close the modal. Return to `/pathways/today`.
5. Node 4 should now show **completed** status. The reactor picked up
   the `AiSessionCompleted` event, the `session-completed` matcher
   fired, and the node auto-completed.

> If this does **not** happen in real-world test: check
> `__pathwaysDev.listDispatches()` in the console. If the dispatch
> shows `nodeCompletions: 0`, the topic URIs in the node's action +
> termination disagree with what `FinishSessionButton` published.

**Requirement-satisfied loop** — after node 6 (Pearson VUE), AWS
issues a real VC. Any path that puts it in the wallet triggers the
reactor. For scripted testing:
```js
__pathwaysDev.simulateCredentialClaim({
    type: 'AWSCertifiedCloudPractitioner',
    issuer: 'did:web:aws.example',
});
```
Watch for:
- `CredentialClaimedPathwayCta` modal appears. Copy: "Advanced 'Earn:
  AWS Cloud Practitioner credential' on AWS Cloud Practitioner."
- Node 7 flips to completed.
- Pathway-level outcome "Earned AWS Cloud Practitioner" shows as
  bound on `/pathways/today` (outcome binder also ran).

---

## 3. Real-world (~10 min, one-time validation)

The goal of this pass is to prove the instrumentation in the actual
chokepoints (`useAddCredentialToWallet`, `FinishSessionButton`) fires
correctly with the same contract the simulators exercise. You only
need to do this once after a schema change — failures here typically
mean a regression in the publisher side, not the reactor.

### 3a. Real credential claim

Follow any of these paths with a freshly seeded AWS pathway in place:

| Source | How to trigger |
|---|---|
| Claim link | Open `/claim/boost?boostUri=...&challenge=...` with a real boost link. |
| Dashboard | Use the in-app "Claim from Dashboard" flow with a real credential exchange. |
| Partner SDK | Use the `@learncard/partner-connect` SDK `saveCredential` method from an embedded app. |
| Interaction URL | `/interactions/claim/<base64-payload>`. |

Expected result:
1. Standard "Successfully claimed Credential!" toast appears as before.
2. ~150ms later, the `CredentialClaimedPathwayCta` modal appears on
   top of it (if the credential matched a termination or outcome on
   any active pathway).
3. `__pathwaysDev.listDispatches()` shows a new entry with the real
   `credentialUri` and `source: 'claim-link' | 'dashboard' | ...`.

Issues to watch for:

- **No modal appears** and `listDispatches()` is empty → publisher
  didn't fire. Check `useAddCredentialToWallet.onSuccess` in Network
  tab or add a `console.log` inside its `try/catch`.
- **Modal appears but node doesn't flip** → publisher fired but
  `ownerDid` mismatch; check the dispatch record's proposals. The
  reactor logs `[pathwayProgressReactor] proposal owner does not
  match session owner` in that case.
- **Modal flashes and disappears** → stacking collision with the
  claim-surface's own modal. The 150ms defer in
  `PathwayProgressReactorMount` should handle this; if not, bump the
  delay.

### 3b. Real AI tutor session

1. From Node 4 on the AWS demo pathway, tap **Start session**.
2. Have a brief conversation with the tutor (a single message is
   enough to avoid the "no messages, skip finish" branch in
   `FinishSessionButton`).
3. Tap **Finish Session** → **Finish** in the confirmation.
4. After the session ends and the modal closes, navigate back to
   `/pathways/today`.
5. Node 4 should show as **completed**.

Issues to watch for:

- **`listDispatches()` empty after finish** → the chat store's
  `currentTopicUri` atom may not have been populated. Check that
  `startTopicWithUri` ran (it should have, since the tutor launched).
- **Dispatch fired but didn't match** → the `topicUri` on the node's
  `session-completed` termination doesn't equal the one in the chat
  store's `currentTopicUri` atom. Both must be the exact same string.

---

## 4. Regression tests (unit)

Nothing here requires running anything manual — included for
completeness of the architecture coverage. Expected counts after the
architecture changes:

```bash
pnpm exec vitest run src/pages/pathways --reporter=dot
# Test Files  52 passed | 1 skipped (53)
#      Tests  899 passed | 4 skipped (903)
```

The **72 new tests** live in:
- `src/pages/pathways/core/credentialIdentity.test.ts` (19)
- `src/pages/pathways/core/nodeRequirementMatcher.test.ts` (24)
- `src/pages/pathways/agents/nodeProgressBinder.test.ts` (11)
- `src/pages/pathways/events/walletEventBus.test.ts` (12)
- `src/pages/pathways/events/pathwayProgressReactor.test.ts` (6)

---

## Known limitations

- **AI session modal is suppressed.** `PathwayProgressReactorMount`
  only raises the CTA modal for credential ingests. Session-end
  already has its own in-chat summary UI; stacking a second modal
  over it would be noisy. If you want the "advanced your pathway"
  affordance on session-end too, flip the `shouldPresentForDispatch`
  rule.
- **`ArtifactUploaded` and `SelfAttestConfirmed` events aren't
  wired.** The bus and reactor accommodate them trivially (new
  `WalletEvent` variant, new binder branch, publish from the
  upload/attest surfaces), but no publishers exist yet. Self-attest
  still flips via the existing `completeTermination` action in the
  pathway store.
- **Trust registry is blank.** Every signed DID classifies as
  `trusted`. When the issuer registry lands, the reactor accepts a
  real `IssuerTrustRegistry` via `createPathwayProgressReactor(opts)`
  and the `institution` tier comes alive.
- **No review surface for completion proposals.** All three
  auto-accept toggles default to `true`. When the review UI ships,
  flip `autoAcceptCredential: false` on the module-level reactor and
  learners will see pending completion proposals in the Proposals tab.
