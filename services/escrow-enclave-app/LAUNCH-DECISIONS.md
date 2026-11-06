# Escrow Launch Decision Records

Decision packet for the open escrow launch decisions referenced from
[ROLLOUT.md](ROLLOUT.md#launch-blockers--do-not-roll-out-beyond-internal-until-these-are-resolved).
Each record states context, options, risks, a recommendation, the evidence that
exists today, and what "decided" looks like.

**Nothing in this file is an approval.** Owners and decisions below are
placeholders until a named approver records a decision and date. Recommendations
are the author's proposals for owners to accept or reject. Line references are
against `main` at the time of writing (2026-10-26) and may drift.

**Launch plan (2026-11-05).** There are no intermediate percentage stages any more:
SSS launches only together with escrow at 100% (decision 2026-10-31), for LearnCard
and VetPass production in the same change (#1875). Where a record below was accepted
"for stage 1" with a revisit "before stage 2", that revisit now happens before the
100% switch. D10's 100% amendment was accepted on 2026-11-05; RT's is still pending
owner sign-off.

**Recording a decision:** replace `_pending_` with `Accepted` / `Rejected` /
`Accepted with conditions`, fill in the approver's name, role and date, link the
evidence (PR, ticket or meeting notes), and update the matching ROLLOUT.md item
in the same PR.

| ID  | Decision                                     | Blocks                                | Owner (placeholder)       | Decision                                                          |
| --- | -------------------------------------------- | ------------------------------------- | ------------------------- | ----------------------------------------------------------------- |
| D10 | Accept KMS key-admin policy rewrite residual | 100% switch (ROLLOUT.md item 4)       | Jackson Smith             | Accepted (A) for 100%, 2026-11-05                                 |
| RAR | Accept R-AUTHORITY-ROLLBACK until archiver   | Launch without archiver (all stages)  | Jackson Smith             | Accepted (A), up to 100%; hardening by 2026-12-31                 |
| RT  | Roughtime sources for production volume      | 100% switch (ROLLOUT.md item 1)       | Jackson Smith             | Accepted (A), stage 1; 100% pending (owner deferred measurements) |
| CNL | Bearer-only vault cancellation               | Not a listed blocker; security call   | Jackson Smith             | Accepted (A) + D post-launch                                      |
| P-a | PIN prompt for migrated Web3Auth users       | Product call, not a listed blocker    | Jackson Smith             | Accepted (C)                                                      |
| P-b | Email backup share default                   | Product/security call                 | Jackson Smith             | Off at launch                                                     |
| P-c | Privacy-policy disclosure                    | Legal call before real users (switch) | Legal (via Jackson Smith) | Text approved and published; app link and legal approver pending  |
| P-d | Userflow gating fix                          | Fix gap 1 (#1967)                     | Jackson Smith             | Accepted: fix gap 1 (#1967)                                       |

---

## D10 — `escrow-kms-admin` can rewrite the escrow CMK key policy

**Context.** An MFA-authenticated `escrow-kms-admin` session can call
`kms:PutKeyPolicy` and add an unattested `kms:Decrypt` Allow, bypassing the
attestation gate entirely.

- [SECURITY.md:89](SECURITY.md) (D10), [SECURITY.md:134](SECURITY.md) (threat table)
- [STAGING.md:798-825](STAGING.md#d10-escrow-kms-admin-can-still-rewrite-the-kms-key-policy-residual-mitigated-not-eliminated)
- [`infra/escrow-enclave/README.md:430-474`](../../infra/escrow-enclave/README.md) (mitigations; immutable-policy alternative)
- [ROLLOUT.md:63-70](ROLLOUT.md) (blocker 4; stage 1 needs a documented decision)

**Options.**

| Option                                                                                                                                                                       | What it costs                                                                                                                                                                                                                                                                                                                                                              | Residual risk                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Accept with current mitigations** (CODEOWNERS two-person review, `DenyPutKeyPolicyWithoutMFA`, no `kms:CreateGrant`, debug-PCR denies, CloudTrail `PutKeyPolicy` alarm) | Nothing new. Measurement rotation stays an in-place policy edit (N/N+1).                                                                                                                                                                                                                                                                                                   | A deliberate insider with MFA, or a stolen MFA session, can still rewrite the policy. That is **detected** (alarm) but not **prevented**. Detection only counts once the trail and alarm are deployed and drilled in the target account (STAGING.md:815-819). |
| **B. Immutable key policy** (`bypass_policy_lockout_safety_check = true`, no principal keeps `kms:PutKeyPolicy`)                                                             | Each measurement rotation (every image roll that changes PCRs) needs a **new CMK**, re-seal (attested `GenerateDataKey` on first boot against the new key) and alias cutover, instead of a policy edit. The rotation runbook and staging rehearsal (STAGING.md §11) would need rewriting. A mistake in an immutable policy cannot be fixed. Only the key can be abandoned. | Removes the admin-rewrite path for that key. Org/management admins remain trusted for everything else (SCPs, monitoring; SECURITY.md:160-163).                                                                                                                |
| C. Hybrid: accept now, revisit at a set stage                                                                                                                                | Same as A now, with a review at a set point (e.g. before 50%).                                                                                                                                                                                                                                                                                                             | Same as A until the review.                                                                                                                                                                                                                                   |

**Recommendation: A (or C).** Accept D10 for launch, on condition that the
production CloudTrail trail and `EscrowKmsGovernanceChange` alarm are deployed
and drilled first (ROLLOUT.md:82-88). Reasoning: B turns every image roll into a
new-key operation. That is a much larger operational risk while rotations are
still frequent, and it does not remove the trust in org admins anyway. Revisit B
once the release cadence settles.

**Evidence today.** Mitigations are in Terraform. The staging trail gap
(no trail as of 2026-10-20) is recorded in STAGING.md:815-819, and staging drills
are recorded in SECURITY.md (Staging verification 2026-10-23). **Not verified
here:** production trail/alarm deployment or production drills.
**Doc inconsistency to fix:** `infra/escrow-enclave/README.md:448` still says
the CloudTrail alarm is "Not implemented by this module — TODO (P7.1)", while
STAGING.md and ROLLOUT.md describe the alarm as existing.

**Decided looks like:** a named security approver and date recorded below, the
chosen option, and (for A/C) a link to the production `PutKeyPolicy` alarm drill
result.

**Decision (2026-10-30), stage 1 only: A.** Accepted for internal-only escrow (the
SSS pilot channel and production canary accounts). Production evidence: the
escrow CloudTrail trail is logging with no delivery error; the
`escrow-enclave-production-kms-governance` rule fired on every `PutKeyPolicy`
during the step 7 image work (2026-10-27 22:05Z, 22:48Z, 23:25Z) and on the
#1820 Drill 2; pages reached the alarm inbox (operator-reported). Revisit before
stage 2 (any non-internal user), together with option B, once the image-roll
cadence settles.

`Owner: Jackson Smith` · `Decision: Accepted (option A), stage 1 internal` · `Approver/date: Jackson Smith, 2026-10-30`

**Proposed amendment for the 100% launch (2026-11-05): A for full exposure.** The
stage 1 revisit falls due before the switch, since there is no stage 2 any more. The
proposal keeps option A for all LearnCard and VetPass production users, because the
image-roll cadence has not settled (two production rolls so far: the steady image
`6dc94e2b…` on 2026-10-27, and the D21 image `18902a68…` on 2026-11-05, both as
in-place N/N+1 policy edits), and option B would make every such roll a new-key
operation. Conditions, all already required elsewhere in this file or ROLLOUT.md:

- The production escrow CloudTrail trail keeps logging with no delivery error, and
  `escrow-enclave-production-kms-governance` stays enabled.
- Every `PutKeyPolicy` remains a reviewed, two-person change: the 2026-11-05 roll's
  policy edits were reviewed in #1958 (approver TaylorBeeston) and applied by the
  MFA operator. They paged as designed: the 2026-11-05 01:55Z production
  `PutKeyPolicy` apply triggered `escrow-enclave-production-kms-governance` 2× and
  `escrow-enclave-production-authority-credential_key` 1× (EventBridge
  `TriggeredRules`).
- `DenyPutKeyPolicyWithoutMFA`, no `kms:CreateGrant` and the debug-PCR denies stay in
  the key policies.
- Option B is revisited once the image-roll cadence settles.

**Decision (2026-11-05): A accepted for 100%** (all LearnCard and VetPass production
users), with the conditions above.

`Owner: Jackson Smith` · `Decision: Accepted (option A) for 100%` · `Approver/date: Jackson Smith (CTO), 2026-11-05`

---

## R-AUTHORITY-ROLLBACK — authority-table rollback/purge without archived history

**Context.** Until the [authority archiver](AUTHORITY-ARCHIVER.md) ships, an
attacker who has already broken the admin boundary could coherently roll back or
purge the DynamoDB authority table. Today that would surface only through
best-effort signals (CloudTrail data-event write alarms and governance/trail-tamper
alarms). There is no independent archived history. Table-only sweeps cannot
detect a coherent loss of all historical rows.

- Definition: [SECURITY.md:90-101](SECURITY.md)
- Observer limits: [SECURITY.md:142-176](SECURITY.md#independent-authority-observer-and-residual-risks)
- Gate wording: [ROLLOUT.md:8-10](ROLLOUT.md), [ROLLOUT.md:89-90](ROLLOUT.md), [ROLLOUT.md:135-139](ROLLOUT.md); [AUTHORITY-ARCHIVER.md:3](AUTHORITY-ARCHIVER.md); [PRODUCTION.md:12](PRODUCTION.md); [AUDIT-COVERAGE.md:94](AUDIT-COVERAGE.md)

ROLLOUT.md says this is **not a launch blocker unless security rejects it**. The
original decision kept the archiver as a hard gate before stage 4 (50%); the
2026-10-31 amendment below removes that gate.

**Options.**

| Option                                                                              | Cost                                                                     | Risk                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A. Accept until the 50% gate**                                                    | None now. The archiver must still ship before 50%.                       | At 1–10% exposure, a privileged attacker could erase hold/PIN-budget history, and detection depends on alarms they may be able to suppress. A stolen writer identity can evade the nonwriter filter (SECURITY.md:94-97). |
| B. Reject: ship the archiver before launch                                          | Delays launch by the archiver build plus drills (AUTHORITY-ARCHIVER.md). | Lowest residual risk. Schedule risk.                                                                                                                                                                                     |
| C. Accept with tighter bounds (e.g. stay ≤1% until archiver, or set an expiry date) | A process constraint only.                                               | Same as A, with less exposure.                                                                                                                                                                                           |

**Recommendation: A, with C's bound as a condition.** Accept for launch, but
cap exposure at the 10% stage that ROLLOUT.md already sets (or 1% if security
prefers) and set a target date for the archiver. Reasoning: the risk requires
a prior compromise of the admin boundary, which D10 already trusts. The
archiver is already scheduled as a hard gate before broad exposure.

**Evidence today.** The CloudTrail trail/alarm drills on staging are recorded in
SECURITY.md (2026-10-23). The archiver is designed but deferred
(AUTHORITY-ARCHIVER.md:3). **Not verified here:** production alarm delivery.

**Decided looks like:** a named security approver and date, the accepted exposure
cap, and the archiver target date.

**Decision (2026-10-30): A, with C's bound.** Accepted for stage 1 (internal).
Exposure stays at or below the 10% stage until the authority archiver ships and
is approved (ROLLOUT.md stage 4 gate, unchanged). Archiver target date: to be
set before stage 2. Production authority alarms are deployed
(`escrow-enclave-production-authority-*`, `trail-tamper`).

**Amended decision (2026-10-31): A, without the 10% cap.** R-AUTHORITY-ROLLBACK is
accepted for every rollout stage up to 100%; the archiver is no longer a launch or
stage gate. Rationale: a coherent authority-table rollback requires an attacker who
has already broken the AWS admin boundary, the same attacker accepted under D10, who
could instead rewrite the KMS key policy (a worse outcome). The archiver adds
after-the-fact detection against a narrower attacker (table write without full
admin), not prevention, so it does not justify gating launch. Context: SSS and escrow
launch together at 100% (decision 2026-10-31), so a percentage cap would block launch.

This amendment clears only the RAR gate. The rationale relies on D10, and D10 and RT
are still accepted for stage 1 only, each with a revisit before stage 2. Launching
at 100% also needs D10 and RT amended (or re-accepted) for full exposure; RT's
depends on the measured request counts and forecast. Until then this is not the
last gate before the switch.

Conditions (verified 2026-10-31 unless noted):

- Point-in-time recovery stays enabled on the authority table (enabled, 35-day
  window) and deletion protection stays on (on).
- The escrow CloudTrail trail keeps logging authority-table writes, including
  batch, transaction and PartiQL writes (logging, log-file validation on, no
  delivery error), and the seven `escrow-enclave-production-authority-*` rules
  stay enabled (enabled).
- **Before the switch:** drill the production denied-write and unexpected-write
  alarms and record the outcome. **Done 2026-11-05 ~17:10Z:** an SSO admin
  conditional `DeleteItem` on a nonexistent authority key
  (`DRILL#2026-11-05-denied-write`, condition `attribute_exists`) was denied
  (`AccessDeniedException`; no change was possible).
  `escrow-enclave-production-authority-unexpected_write` and `-denied_write` each
  triggered and invoked once with 0 failed invocations; SNS
  `escrow-enclave-production-ledger-alerts` published 2, delivered 2, failed 0 to
  escrow-alarm@learningeconomy.io; the monitor DLQ was empty.
- Two-person MFA controls and the guardrail SCPs stay in place.
- Hardening follow-up, not a gate: a lightweight tamper-evident history (scheduled
  locked AWS Backup copies of the authority table in a separate account plus a
  monitor reconciliation), or the full archiver in AUTHORITY-ARCHIVER.md. Target
  date to be recorded before the switch.

**Hardening follow-up (decided 2026-11-05, Jackson Smith): target date 2026-12-31.**
Mechanism: a same-account AWS Backup vault with Vault Lock in compliance mode for the
authority table (no new AWS account), plus CloudWatch/EventBridge alarms on Backup
plan, selection and vault changes and on failed backup jobs. Retention is chosen at
implementation; compliance mode is irreversible once its grace period ends. Why it
addresses the threat: locked recovery points cannot be deleted or have their
retention shortened, even by an account admin or root, so a coherent rollback or
purge of the table leaves an independent history. An attacker can still stop future
backups, hence the alarms.

`Owner: Jackson Smith` · `Decision: Accepted (A) for all stages; archiver is post-launch hardening` · `Approver/date: Jackson Smith, 2026-10-31`

---

## RT — Roughtime sources for production volume beyond 1%

**Context.** Every enclave time sample needs **2 of 3** pinned Roughtime servers
to return signed, mutually intersecting intervals (radius cap 10 s), within one
shared 2 s deadline.

- Pins: [`src/time/servers.rs:5-20`](src/time/servers.rs): Cloudflare (`roughtime.cloudflare.com:2003`, IETF draft-08, "beta key"), int08h (Google legacy), time.txryan.com (Google legacy)
- Policy: [`src/time.rs:141-149`](src/time.rs) (`production()` = 3 pins, `min_sources = 2`, 10 000 ms radius)
- Fan-out: [`src/time.rs:152-172`](src/time.rs): each sample sends **one request to each of the 3 servers in parallel**, then returns as soon as 2 agree (the third request has normally already been sent)
- Blocker: [ROLLOUT.md:44-47](ROLLOUT.md)

Pins are compiled into the measured image. Changing any server or key changes
the PCRs, so it needs an image roll and a KMS policy update (see D10).

**Published terms (researched 2026-10-26):**

| Operator        | What is published                                                                                                                                                                                                                                                                                                                                              | Source                                                                                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare      | "Cloudflare Roughtime is currently in beta." Says the root public key "may change in the future". Anycast address. **No published SLA or rate limit found.** Time Services terms (updated 2026-04-24, fetched 2026-10-26) only say use means agreeing to Cloudflare's general Website and Online Services Terms of Use; those general terms were not reviewed. | <https://developers.cloudflare.com/time-services/roughtime/usage/>, <https://developers.cloudflare.com/time-services/roughtime/>, <https://developers.cloudflare.com/time-services/tos/> |
| int08h          | Address, port 2002, long-term key (also in DNS TXT). **No published terms, availability statement or rate limit found.** The only licence on the page is the site-content CC-BY-SA footer.                                                                                                                                                                     | <https://int08h.com/post/public-roughtime-server/>                                                                                                                                       |
| time.txryan.com | "Individual users may point a client" at it. Before high-volume infrastructure use, contact the operator. No uptime or accuracy guarantee, but "monitored and maintained". No numeric rate limit.                                                                                                                                                              | <https://time.txryan.com/>                                                                                                                                                               |

A web search for published Cloudflare/int08h Roughtime rate limits or terms found
nothing beyond the pages above. The operator approval for time.txryan.com
(Tanner Ryan, 2026-10-01) is **operator-reported**. No written artifact was found
in this repository. Store the email/message with this record.

**Request volume estimate (estimate, not measured).** Each Roughtime _sample_
sends 1 request to **each** server. Samples come from two places:

1. Policy-level samples: `authority_time()` once in create-hold
   ([`src/policy/authority.rs:507`](src/policy/authority.rs)), release (`:734`),
   cancel (`:966`), confirm (`:1052`), resend-code (`:1290`), commit (`:1390`), and
   **twice** in send-release-warning (`:1168`, `:1207`).
2. **Every AWS call** gets a fresh sample: DynamoDB Get/TransactGet/TransactWrite
   and SES SendEmail ([`src/authority/aws.rs:388-390`](src/authority/aws.rs)), and
   each KMS client ([`src/kms/aws.rs:60-64`](src/kms/aws.rs)).

Assumption A1 (unverified): each authority operation makes ~2–4 AWS calls
(read(s) + one TransactWrite, + SES where email is sent). That gives roughly:

| Enclave operation                            | Policy samples | AWS calls (assumed) | Samples ≈ requests **per server** |
| -------------------------------------------- | -------------- | ------------------- | --------------------------------- |
| create hold (delay policy, sends code email) | 1–2            | 3–4                 | ~4–6                              |
| confirm hold                                 | 1–2            | 2–3                 | ~3–5                              |
| send release warning (+email)                | 2–3            | 3–4                 | ~5–7                              |
| release                                      | 1–2            | 2–4                 | ~3–6                              |
| cancel                                       | 1–2            | 2–3                 | ~3–5                              |
| hold-state / read                            | 0              | 1–2                 | ~1–2                              |
| enrol / rewrap                               | 0–1            | 2–3                 | ~2–4                              |

Per user flow (A2: 3 state reads per 7-day recovery, and no resends):

- **7-day hold recovery** ≈ create 5 + confirm 4 + warning 6 + release 5 + reads 3×1.5 ≈ **~24 requests per server** (range ~18–33).
- **PIN recovery** ≈ create 5 + release 5 ≈ **~10 per server** (range ~7–12).
- **Enrolment** ≈ **~3 per server**, once per auto-enrolled user (plus any
  rewraps, frequency unknown).

Sizing formula: `requests/server/day ≈ 24·H + 10·P + 3·E + 3·R`, where H = hold
recoveries/day, P = PIN recoveries/day, E = new enrolments/day, R = rewraps/day.
Worked example with **illustrative, not forecast** numbers: 1% of 100 000
eligible users enrolled over the first week means E ≈ 143/day → ~430 req/server/day.
Add 10 H + 20 P ≈ 440 → **~870 requests per server per day**. That is roughly
0.01 req/s on average. Bursts are ~5 requests within a few seconds per operation.
Total = 3× across the three servers. Real H/P/E values must come from the
product traffic forecast (ENROLLMENT-AUTHORITY.md:864, open question 4).

**Before asking operators, measure:** count parent-relay Roughtime requests per
operation on staging (vsock relay, `src/time/relay.rs`) to replace assumption A1.

**Options.**

| Option                                                               | Risk                                                                                                                                                                                                                  |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Keep 3 sources, get written acknowledgment from each operator** | Two of three are best-effort with no published SLA. Losing any two at once stops all releases/cancels/creates (fail closed: availability, not safety). Cloudflare's key "may change", which would need an image roll. |
| B. Add a 4th/5th independent source (still 2-of-N)                   | More availability headroom. Each addition is an image roll and needs operator review. Independence must be reviewed (`src/time.rs:101-103`).                                                                          |
| C. Raise quorum or drop a source                                     | Reduces availability. Not recommended.                                                                                                                                                                                |

**Recommendation: A now, plan B before 10%.** Ask each operator for written
acknowledgment of expected volume (send the measured per-operation numbers and a
forecast-based peak and daily figure), any rate limits, planned key rotation or
deprecation notice, and an operational contact. Specifically:

- **Cloudflare:** does the beta label limit production reliance, will the key
  change, is there a rate limit or a deprecation notice channel?
- **int08h:** is the Google-legacy endpoint (port 2002) supported long term, and is there a volume ceiling or contact?
- **txryan:** confirm the 2026-10-01 approval in writing, covering the forecast volume.

Separately, monitor the per-source failure rate. Losing one source is invisible
to users but takes away the remaining margin.

**Decided looks like:** a written reply (or documented no-reply) from each
operator linked here, a measured per-operation count, a volume forecast, and an
infra/ops approver and date accepting the availability risk.

**Decision (2026-10-30), stage 1 only: A.** Internal volume (pilot devices plus
the canary's ~2 PIN recoveries an hour, roughly 20 requests per server per hour
by the estimate above) is accepted on the three pinned sources. Before stage 2:
written acknowledgments (or documented no-reply) from Cloudflare, int08h and
time.txryan.com, a measured per-operation count, and a volume forecast.

**Update (2026-10-30): operator acknowledgments received.** Cloudflare, int08h and
time.txryan.com have acknowledged LearnCard's use (operator-reported by Jackson
Smith; store the replies with this record). Still to attach before stage 2: the
measured per-operation request count from staging and the volume forecast.

`Owner: Jackson Smith` · `Decision: Accepted (option A) for stage 1; operator acknowledgments received; stage 2 needs the measured count and forecast` · `Approver/date: Jackson Smith, 2026-10-30`

**Proposed amendment for the 100% launch (2026-11-05): A for full exposure.** Keep
the three pinned sources (2-of-3) for all LearnCard and VetPass production users. The
stage 1 decision listed two items for any wider exposure; both are still open and
are conditions of this amendment, not done:

- [ ] Measured per-operation Roughtime request count from staging (replaces
      assumption A1 above). Not yet measured.
- [ ] A 100% volume forecast (H, P, E, R in the sizing formula above): expected
      auto-enrolments at the switch (every active user is in the bucket at 100%,
      so E peaks in the first days), PIN and hold recoveries per day. Not yet
      produced.
- [ ] Send the measured count and forecast to the three operators (their
      acknowledgments of 2026-10-30 predate a 100% figure) and attach the replies.
- Per-source failure monitoring, as recommended above (not yet in place; a ticket
  is enough for this amendment).

Production evidence so far: canary tier 2 PIN releases (since 2026-10-30) and the
first tier 3 create and confirm (2026-11-04) succeeded, so the three sources have
served real production operations. No per-source failure analysis has been done.

**Update (2026-11-05):** the measured count and 100% forecast were not provided; the
owner deferred them. The 100% amendment remains pending owner sign-off (Jackson
Smith, CTO) and stays an open item on the switch checklist.

---

## CNL — Bearer-only vault cancellation

**Context.** The vault cancels a hold based on bearer-mediated access and the exact
hold commitment, not an owner signature. lca-api authenticates the owner before
it forwards the request.

- [`src/policy.rs:848-866`](src/policy.rs) (`cancel_hold`: "Caller must authenticate user intent before invoking"); authority path [`src/policy/authority.rs:879-966`](src/policy/authority.rs)
- lca-api: `cancelRecovery` (DID+challenge, [`lca-api/src/routes/escrow.ts:1094`](../learn-card-network/lca-api/src/routes/escrow.ts)), `cancelRecoveryByLink` (open route + API-generated token, `:1122-1135`), system cancels for PIN lockout and superseded holds (`:137-163`, `:858`)
- [SECURITY.md:20-25](SECURITY.md), [SECURITY.md:376](SECURITY.md) (live attack C run: "vault cancel is bearer-only")
- Design options: [ENROLLMENT-AUTHORITY.md:939-958](ENROLLMENT-AUTHORITY.md#12-cancellation-authorization-design-not-implemented)

**Threat (compromised lca-api).** It can cancel any hold it can reference.
That is durable denial of a legitimate recovery, and it can repeat for every new
hold. It **cannot** obtain key material through cancel: cancel never grants
release (`src/policy.rs:848-849`, SECURITY.md D14). The same compromised API can
already refuse to forward requests (non-durable DoS) and can trigger the
system-cancel paths. Nothing worse was identified in the docs or code paths
reviewed. A DoS against a user who is locked out is still serious harm: they may
lose access for good if every attempt is cancelled.

**Options.**

| Option                                                                                      | Cost                                                                                                                              | Risk                                                                                          |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **A. Accept for launch**                                                                    | None.                                                                                                                             | A compromised API can durably cancel. The user experience is a repeatedly cancelled recovery. |
| B. Owner DID signature verified in the vault (ENROLLMENT-AUTHORITY §12 recommendation)      | New protocol version, client signing, image roll. The API-only email link must stop being a bypass. Locked-out users cannot sign. | Removes unauthorised durable cancel. Does not stop the API from withholding service.          |
| C. Vault-issued emailed cancel token                                                        | Larger design (token generated, sent and consumed inside the vault).                                                              | Enables inbox-only cancel. Phishing and scanner considerations apply.                         |
| D. Detection: alert on cancel volume/anomalies (non-user cancels, many cancels per account) | Small. Metrics on existing events.                                                                                                | Detects, does not prevent.                                                                    |

**Recommendation: A + D for launch, B as a tracked follow-up before broad rollout.**
The impact is availability, not disclosure, and it needs an API compromise that
already permits other DoS. Add cancel-rate alerting so mass cancellation is noticed.

**Evidence today.** The staging attack C run (SECURITY.md:376) confirms signed
cancel commits and the bearer-only gap. No cancel alerting was found in this review.

**Decided looks like:** a security approver and date accepting A, plus tickets for
D and B with target stages.

**Decision (2026-11-05): A for launch, with D (cancel-rate/anomaly alerting) as a
post-launch follow-up; B tracked later.**

`Owner: Jackson Smith` · `Decision: Accepted (option A) for launch; D post-launch; B tracked` · `Approver/date: Jackson Smith (CTO), 2026-11-05`

---

## P-a — PIN prompt for migrated Web3Auth users

**Current behaviour (from code).** The first-time PIN setup prompt fires only
when `wasNewUserRef` is set. That happens only when the coordinator passes
through `needs_setup`
([`apps/learn-card-app/src/providers/AuthCoordinatorProvider.tsx:601-623`](../../apps/learn-card-app/src/providers/AuthCoordinatorProvider.tsx)).
Web3Auth users go through `needs_migration` instead (`:783-849`), so **migrated
users get no first-time PIN prompt**. If they fall in the rollout bucket they can
still be silently auto-enrolled (ROLLOUT.md:27-29). That gives them only the
7-day hold path until they set a PIN in settings. Post-recovery prompts
(`decidePinPromptAfterReady`, `:627-643`) apply to everyone.

**Options.** A: keep as is (no prompt). B: prompt migrated users once after
migration completes and they are enrolled. C: prompt at the next login after
auto-enrolment, for any enrolled user without a PIN.

**Risks.** A: migrated users wait 7 days to recover. B/C: one more step for a
population that already went through a forced migration. Prompt fatigue.

**Recommendation: C** (prompt once when an enrolled user has no PIN, whatever
the path). It covers migrated users and auto-enrolled existing users the same
way and reuses the existing prompt flag. Product should confirm.

**Decided looks like:** a product approver and date, plus a ticket if B/C.

**Decision (2026-10-28): C.** Implemented in `decidePinPromptAfterReady`
(`apps/learn-card-app/src/providers/authCoordinator.helpers.ts`): an account that
is escrow-enrolled, has no PIN, and has no prompt flag on this device gets the
first-time prompt, unless it was created this session (new-user setup owns that
prompt). Only enrolled accounts qualify, so the rollout gate still decides who
is asked. Setting the PIN also activates a provisional migrated record, which
protects it from the 30-day purge of unactivated migrations
(`services/learn-card-network/lca-api/src/models/UserKey.ts`, `PROVISIONAL_MIGRATION_TTL_MS`).
The flag is per device, so a skipped prompt is asked again on a new device.

`Owner: Jackson Smith` · `Decision: Accepted (option C)` · `Approver/date: Jackson Smith, 2026-10-28`

---

## P-b — Email backup share default

**Current behaviour (from code).** The app/tenant default is **on**:
`enableEmailBackupShare` defaults to `true` in
[`packages/learn-card-base/src/config/tenantConfigSchema.ts:126`](../../packages/learn-card-base/src/config/tenantConfigSchema.ts),
[`tenantDefaults.ts:67`](../../packages/learn-card-base/src/config/tenantDefaults.ts),
[`authConfig.ts:202,237`](../../packages/learn-card-base/src/config/authConfig.ts) and
`apps/learn-card-app/environments/learncard/config.json:30`. The underlying
package defaults to **off** (`packages/sss-key-manager/src/sss-strategy.ts:983`), and
`sendEmailBackupShare` returns early when the flag is off (`:3593`). When the flag
is on, a share is sent (a) when the user sets up email recovery in
`RecoverySetupModal` (`:480-487`), and (b) automatically after a phone-only user
links an email (`AuthCoordinatorProvider.tsx:1590-1636`). Any 2 shares
reconstruct the key (`packages/sss-key-manager/README.md:102-109`). The README
says the email share is "encrypted before delivery".

**Docs inconsistencies:** sss-key-manager README:210 says the default is `false`
and that the share is sent "during key setup". Separately, `requireEmailForPhoneUsers`
defaults to `true` in the schema (`tenantConfigSchema.ts:127`) but `false` in
`tenantDefaults.ts:68`. Owners should confirm which value is intended.

**Options.** A: keep default on. B: default off, tenants opt in. C: on, but only
sent on explicit user action (drop the automatic send after phone→email upgrade).

**Risks.** A: an inbox compromise plus one other share can recover the key.
How much this matters depends on the email-share encryption, which was not
reviewed here. B: fewer recovery paths for users. C: phone users who upgrade get
no email backup unless they ask for one.

**Recommendation: needs a security read of the email-share encryption first. If
that holds, keep A.** If it does not hold, choose C. Either way, fix the README default.

**Decided looks like:** product and security approvers and date, plus a docs fix PR.

**Update 2026-10-28 (interim, not a decision).** Email recovery is unavailable in
practice: since commit `4b83aa9ee` the Email recovery tab only appears when
`auth.sss.escrowRelayPublicKey`/`escrowRelayKeyId` are set
(`isEmailRelayConfigured`, `packages/learn-card-base/src/config/authConfig.ts`),
and no tenant sets them. This was a side effect of the missing relay key, not a
product decision. The relay (`services/escrow-relay`) is a separate Lambda, not
the enclave, and it emails the recovery share **in readable form**: inbox access
plus one other share recovers the key. The production LearnCard and VetPass
configs now set `enableEmailBackupShare: false` so the flag matches behaviour at
launch. Re-enabling needs this record decided, a relay key pinned in tenant
config, and `ESCROW_RELAY_URL`/`ESCROW_RELAY_AUTH_TOKEN` in production lca-api.

**Decision (2026-10-30): off at launch.** Email backup stays off for LearnCard and
VetPass (`enableEmailBackupShare: false`, no relay key). Reasons: for email-login
accounts the Firebase sign-in is itself an email code, so inbox access releases the
auth share; an emailed share in the same inbox would make the inbox alone sufficient
to rebuild the key (2 of 3). The relay also delivers the share in readable form.
Escrow, with its PIN and 7-day notice, is the backup. Revisit only with a design that
does not put a share in the login inbox.

`Owner: Jackson Smith` · `Decision: Off at launch (option B, no tenant opts in)` · `Approver/date: Jackson Smith, 2026-10-30`

---

## P-c — Privacy-policy wording

**Current state.** The app links to a single external policy:
`https://www.learncard.com/learncard-privacy-policy`
(`apps/learn-card-app/src/helpers/externalLinkHelpers.ts:32,44`; tenant
`privacyPolicyUrl` in `environments/learncard/config.json:102`). Its current text
was **not reviewed** (it is outside the repo). No escrow-specific privacy wording
was found in the app or escrow docs.

**What escrow does with data (from the escrow docs). These are suggested
plain-language disclosure points for legal review, not legal advice:**

1. An encrypted recovery copy of the account key is held by a hardware-isolated
   service (AWS Nitro Enclave) and released only after a PIN or a waiting period.
2. The recovery email address and a language preference are stored with the
   encrypted recovery data and used to send recovery emails (SECURITY.md:357).
3. Recovery emails (one-time codes, started, release-warning, and cancelled
   notices) are sent through Amazon SES, by the enclave and by the LearnCard API.
4. Starting a recovery begins a 7-day hold. The user is emailed and can cancel
   from a signed-in device or by email link (SECURITY.md:357,
   ENROLLMENT-AUTHORITY §12).
5. Hold and cancellation records, and an append-only authority log of recovery
   events, are kept for security/audit. Retention periods are **not specified in
   this review**. Legal should get them from engineering (AUTHORITY-ARCHIVER.md
   lists retention/privacy as an open review item at :491).
6. Some users are enrolled automatically (silently) as part of a staged rollout
   (ROLLOUT.md:14-33). Whether and how users can opt out of auto-enrolment was
   **not confirmed** in this review.
7. If email backup is on, a share of the key is emailed to the user (P-b).
8. Processors involved: AWS (KMS, DynamoDB, SES, Nitro).

**Options.** A: update the main policy before stage 2. B: add a short in-app
disclosure at enrolment and PIN setup, plus a policy update. C: launch internal
(stage 1) without changes and update before stage 2.

**Recommendation: C → B.** Stage 1 is internal testers only. Before any real
user (stage 2), legal approves policy text covering the points above, and
product adds a short in-app notice, because auto-enrolment is silent.

**Decided looks like:** a legal approver and date, plus a link to the published
policy revision.

**Update (2026-10-30): legal approved the new privacy-policy text** (operator-reported
by Jackson Smith; link the approved text and approval here). The short in-app notice
recommended above is still a product item before automatic enrollment reaches real
users.

**Update (2026-11-05):** the current published policy is
<https://learncard.com/privacy-policy> ("Last Updated: October 27, 2026"); it covers
escrow and recovery. The app still links
<https://www.learncard.com/learncard-privacy-policy> ("Last Updated: February 4,
2026", no escrow wording). Jackson Smith asked the web team, who own that page, to
make sure the page the app links shows the latest wording; not yet confirmed. The
named legal approver is still pending.
At 100% every active user is silently auto-enrolled at the switch, so the short in-app
notice is a switch prerequisite (ROLLOUT.md, "100% launch").

`Owner: Legal` · `Decision: Policy text approved and published (learncard.com/privacy-policy); app-linked page update and named legal approver pending` · `Approver/date: Legal (name pending), reported by Jackson Smith, 2026-10-30`

---

## P-d — Userflow gating fix

**What was found.** [`apps/learn-card-app/src/constants/userflow.ts`](../../apps/learn-card-app/src/constants/userflow.ts)
has **no escrow-specific logic**, and no escrow doc mentions Userflow. Gating today
covers the tenant token and private share sessions (`:32`, `:41`, `:46`). Neither
the code nor git history confirms what "gating fix" refers to (**unverified**).
Two candidate gaps:

1. **Hard-coded fallback token (`:15-23`).** If the tenant config cannot be
   resolved, the code falls back to LearnCard's production/staging Userflow
   tokens. A non-LearnCard tenant, or a tenant that deliberately left
   `userflowToken` empty, could then load LearnCard's Userflow (and its
   onboarding flows) and identify users there. An empty token is handled
   correctly. Only the resolve-failure path is affected.
2. **Raw DID sent as the Userflow user ID (`:53`).** The rollout docs treat raw
   DIDs as sensitive (ROLLOUT.md:94-111). This is a privacy question for P-c, not
   a gating bug.

If the concern is escrow/recovery Userflow content shown to users outside the
rollout, that is configured in Userflow's dashboard, not in this file. A fix would
pass an attribute (e.g. `escrow_enrolled`) in `identify` so flows can target on
it. This needs product confirmation.

**Proposed diff for gap 1 (not applied):**

```diff
 const getUserflowToken = (): string => {
     try {
         return getResolvedTenantConfig().observability.userflowToken;
     } catch {
-        return typeof IS_PRODUCTION !== 'undefined' && IS_PRODUCTION
-            ? 'ct_qq6z63mixbhyzbzsgmivgrftda'
-            : 'ct_w53eaxhevvf2vejzrecekeq3nu';
+        // Fail closed: no tenant config means no Userflow.
+        return '';
     }
 };
```

**Recommendation:** the owner confirms what "gating fix" means. If it is gap 1,
apply the diff above in a small code PR with a unit test.

**Decided looks like:** an owner names the intended fix, plus a linked PR.

**Decision (2026-11-05): fix gap 1** (Userflow fails closed when the tenant config is
unresolved), PR #1967. Gap 2 (raw DID as the Userflow ID) is a P-c privacy question,
not part of this fix.

`Owner: Jackson Smith` · `Decision: Fix gap 1 (#1967)` · `Approver/date: Jackson Smith (CTO), 2026-11-05`
