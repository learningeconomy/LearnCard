# Bedrock Responses smoke on FrenchFry

This is a synthetic inference check, not a deployment. First run your usual MFA authentication. Use an existing staging-authorized profile; this script does not create credentials or change IAM.

In fish:

```fish
cd /home/taylor/Documents/Codex/2026-09-30/task-3/ai-passport-pr92/services/ai-passport-backend
bun --no-env-file run scripts/benchmark-bedrock.ts --dry-run
bun --no-env-file run scripts/benchmark-bedrock.ts --live-staging --profile work-mfa
```

Replace `work-mfa` with your chosen existing profile. The script prints the STS account and role, then requires typing `RUN` before any model inference. Check that identity is the account/role you intend to test. Missing/expired MFA exits before inference; no MFA command is assumed.

The live run makes at most six sequential synthetic attempts: text streaming, a required client function, and structured function streaming for Sol 6.1 at medium and Luna at none. It uses only the US Runtime profiles, the OpenAI SDK, short-term tokens and `store: false`. No retries or automatic continuation. Each request is capped at 2,048 output tokens including reasoning; the entire serialized input plus 512 framing tokens must fit a conservative 4,096-token bound. Original Zod validation remains authoritative, with optional fields preserved.

The script reserves the full worst-case inference cost before each attempt, including errors and timeouts. Six attempts reserve $0.202752 using Sol's US prices even for Luna and the higher cache-write input rate; it refuses to exceed $0.25. This is a script inference reserve, not an AWS account spending cap. Guardrails, logging, networking and other ancillary charges are outside this narrow model-only check. A client timeout does not prove billing stopped.

Sanitized results are saved to `tmp/bedrock-responses-smoke-summary.json` (dry-run uses `tmp/bedrock-responses-smoke-dry-run.json`). The summary includes safe identity metadata, models, attempts, outcomes, timing and reserved cost; it excludes credential values, prompts, generated text and provider error bodies. Send the live summary back for review. A successful run does not complete production consent, Guardrail/logging, provider-retention or deployment gates.

## Focused follow-up (new approval required)

The first six-call allowance is spent/reserved. Do not run another live check until a fresh bounded approval is agreed. The original summary is preserved. The account confirmed by `RUN` has not been classified as staging; the legacy `--live-staging` flag does not establish that classification.

After new approval and your usual MFA authentication, the focused command is:

```fish
bun --no-env-file run scripts/benchmark-bedrock.ts --dry-run --focused
bun --no-env-file run scripts/benchmark-bedrock.ts --live-staging --profile work-mfa --focused
```

This selects three attempts: Sol required-tool, Sol named-tool streaming, and Luna named-tool streaming. Maximum inference reserve is $0.101376; per-request bounds, efforts and the 30-second deadline are unchanged. Required-tool and named-tool requests differ in tool choice, so this matrix does not isolate streaming alone. Diagnostics record only allowlisted event types/phases, observed provider HTTP status and separate application-normalized status; they never record arguments/content or raw provider errors. Focused live output is `tmp/bedrock-responses-smoke-focused-summary.json`. A missing provider status means no HTTP response was observed, not that AWS returned the normalized application status.
