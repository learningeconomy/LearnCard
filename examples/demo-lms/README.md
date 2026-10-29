# Demo LMS (EducationOS record source)

A minimal partner-hosted Integration that pushes course completions to EducationOS over
an approved `record-provisioning` Binding (ADR-012 Transactional, system-event trigger).
It is a demo, not a production LMS.

## What it does

- `GET /` shows a form: learner profile ID plus a course.
- `POST /complete` exchanges the service-account secret for a five-minute bearer token
  and calls `integrationService.submitRecord` with one completion record. With
  `Accept: application/json` it answers `{ok, recordId, status, issuance, offerUrl}` or
  brain's `{ok: false, code, message}` instead of the page; an optional `completionId`
  form field replays a completion (the scenario runner uses both).
- `GET /health` answers the platform health challenge. It verifies the pinned platform
  key, issuer, token type, audience (its own URL) and install identity, then echoes the
  `jti` (see `services/learn-card-network/brain-service/INTEGRATION-AUTH.md`).

EducationOS decides the release, not this server. A record is stored only when:

- the Binding is ACTIVE;
- the learner is in the install's ecosystem tree;
- the fields match the Binding's declaration;
- the learner has live consent on the governed contract.

Every attempt is audited.

When the Binding declares `issuance.delivery: 'offer'`, EducationOS signs nothing at release
and returns a claim offer (`issuance.offerUri`). Discovery is the partner's job, so the page
shows it as a link. With `LEARNCARD_APP_URL` set, the link is the LearnCard app's
`/request?vc_request_url=<offerUri>`; otherwise it is the raw VC-API exchange URL. Only the
learner's own wallet can redeem it. Resubmitting the same completion returns the same offer.

## Run the EducationOS walkthrough (start here)

The scenario runner sets up a fresh district, installs this server, approves the Binding,
starts the demo LMS with the right environment and walks every step. From the repo root:

```sh
bun run scenario doctor              # is the dev stack ready?
bun run scenario mvp --driver live   # the whole walkthrough against the running stack
bun run scenario:in-process          # the same steps against vitest's test database
```

The old scripts `prove:demo-lms`, `seed:demo-lms` and `prove:demo-learner` (brain-service)
are retired; they are kept for the manual flow with a real LearnCard app profile, not
maintained:

- `seed:demo-lms` and `prove:demo-lms` take `--learner <profileId>`. Without `--learner`,
  `prove:demo-lms` prints a notice and runs `scenario mvp --driver live`, passing through
  only the runner's options (`--json`, `--keep-lms`, `--only`, `--from`, `--district`); it
  refuses any other argument.
- `prove:demo-learner` has no `--learner` flag. It acts as `DEMO_LEARNER_PROFILE_ID`
  (default `demo-learner`) with its `--register`, `--consent`, `--withdraw`, `--claim` and
  `--claim-offer` flags.

## Run by hand

```sh
BRAIN_URL=<brain-base-url> \
DEMO_LMS_HEALTH_URL=http://localhost:4321/health \
SERVICE_ACCOUNT_ID=... SERVICE_ACCOUNT_SECRET=... \
INSTALL_ID=... ECOSYSTEM_ID=... \
PLATFORM_JWK='{"kty":"OKP","crv":"Ed25519","x":"..."}' \
LEARNCARD_APP_URL=<optional LearnCard app origin> \
bun start
```

`PLATFORM_JWK` comes from `installIntent.integrationSigningKey`. Pin it over a trusted
channel; never fetch it from a token.

## Health probes in local development

Brain only probes HTTPS URLs on public IP addresses by default. For local development,
set `INTEGRATION_HEALTH_ALLOW_LOCALHOST_HTTP=true` on brain (with `NODE_ENV=development`)
and pin `http://localhost:<port>/health` in the manifest. Brain refuses to start with that
flag in production. Until the service account passes its health probe it is not ENABLED,
and every `submitRecord` call is denied.

## Test

```sh
bun test
```
