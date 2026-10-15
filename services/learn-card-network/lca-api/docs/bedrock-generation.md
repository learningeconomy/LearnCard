# Bedrock text generation (LC-2271)

The three LCA text generation routes use the OpenAI SDK Responses API at
`https://bedrock-runtime.us-east-1.amazonaws.com/openai/v1`. This follows the merged
[AI Passport implementation](https://github.com/WeLibraryOS/AI-Passport/pull/92),
inspected at main `300c0af3125a4f1b1785820a2d33866723a88f30`.

| Route                 | Exact Runtime model profile | Effort   | Reason                                                                                 |
| --------------------- | --------------------------- | -------- | -------------------------------------------------------------------------------------- |
| `generateBoostInfo`   | `us.openai.gpt-6.1-sol`     | `medium` | Interpret arbitrary descriptions and generate coherent credential copy across locales. |
| `generateBoostSkills` | `us.openai.gpt-6.1-sol`     | `medium` | Infer appropriate skills and subskills within the existing hierarchy.                  |
| `generateSkillIcons`  | `us.openai.gpt-6-luna`      | `none`   | Straightforward semantic mapping of supplied names to emoji.                           |

AWS's current [Sol model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-openai-gpt-6-1-sol.html),
[Luna model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-openai-gpt-6-luna.html)
and [Responses compatibility guide](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-responses-api.html)
confirm these Runtime profiles and API support. The 8,192-token request ceiling is below
both documented model output limits. Although the current cards advertise native JSON
Schema output, this migration retains AI Passport's required-function pattern and
local validation to preserve existing optional-category semantics.

`generateImage` remains on first-party OpenAI (`dall-e-3`, `OPENAI_API_KEY`), including
its existing Filestack storage. Embeddings and Nova are outside this migration.

## Runtime contract

- The official `@aws/bedrock-token-generator` resolves short-term bearer tokens from
  the normal AWS SDK credential chain in `us-east-1`. On Lambda this means the execution
  role and its rotating credentials. The SDK requests a token for every operation;
  no process-lifetime static bearer is stored by LCA. AI Passport's Fly web-identity
  override is specific to Fly and is not needed for this Lambda service.
- `BEDROCK_BASE_URL` is optional; only the exact default URL above, with an optional
  trailing slash, is accepted. No arbitrary endpoint, model alias or family override.
  The option is scoped to API functions and can also come from `RUNTIME_SECRETS_ID`.
- OpenAI SDK version is pinned to `6.47.0`, matching the inspected implementation.
  No ambient OpenAI organization/project headers; SDK logging is off; redirects fail.
- These routes remain non-streaming. Requests use `store:false`, required function
  selection, `parallel_tool_calls:false`, and a non-strict projected JSON schema.
  The original Zod validators enforce enums, optional categories, unions and string
  bounds after JSON parsing. Native strict structured-output support is not assumed.
- Requests have an 8,192 output-token ceiling (including reasoning) and a 25-second
  SDK timeout (below the existing 29-second Lambda timeout). Failed/incomplete lifecycle, refusal, missing/wrong/duplicate tool,
  malformed JSON and invalid output fail closed. Token-limit exhaustion is an error,
  never a partial success. Input and output sizing still require staging acceptance.
- No automatic retry, provider fallback, or model downgrade. HTTP 429 maps to
  `TOO_MANY_REQUESTS`, 503/504 to `SERVICE_UNAVAILABLE`, and other failures to a
  sanitized `INTERNAL_SERVER_ERROR`. Provider bodies, validation values and credential
  causes are not retained in those errors. Quota failures are not automatically retried.
- Icons still fill omitted requested names with `⭐` after a valid response and discard
  unsolicited names. Provider failures now propagate instead of being logged raw and
  subsequently crashing on an undefined completion. Learner DIDs are no longer sent
  in text-generation provider metadata. Existing authenticated route access remains.

## Deployment and coordination gates

Before rollout, obtain approved staging tests for all three real schemas, locales,
typical and maximum input sizes, token ceilings, timeout behavior and error handling.
Offline tests do not establish provider acceptance, entitlement, latency or generation
quality. Live model calls require separate approval.

Responses does not support attaching native Bedrock Guardrails; if the approved data-handling
policy requires filtering, a separately approved pre-invocation path is a rollout gate.

The deployed Lambda role must have approved Bedrock/default-project access for both
exact cross-region US profiles and access to the Runtime endpoint. Confirm rotating
credential/token operation and the applicable retention, DPA, subprocessor, guardrail
and invocation-logging posture before learner traffic. The reviewed dev policy is managed by Serverless/CloudFormation; it has not been
applied. This PR does not port AI Passport's
application-specific privacy gateway into LCA. US profiles can route across US regions;
the endpoint is not a single-region processing guarantee.

[LearnCard PR1670](https://github.com/learningeconomy/LearnCard/pull/1670) merged on
2026-10-09 at `7656a57d30c6d80b8a25a8bb14bcd3b08b3648c2`. This branch is synced with
main and preserves its `@learncard/service-config` bootstrap, `CONFIG_TENANT`,
tenant/stage selection and runtime-bundle precedence. The optional endpoint is
forwarded by the current API function-environment helper in both bundle and fallback
modes; OIDC and provider environments do not receive it. There is no new bearer-token
secret to provision. Configuration tests use the current deployment contract rather
than restoring the superseded function-environment test.

Rollback uses the prior application revision with its prior OpenAI credential, after
explicit deployment approval. There is no runtime silent fallback to the old models.

## Node 24 and owner-triggered staging deployment

All LCA Lambda functions and the native DIDKit layer declare `nodejs24.x`; esbuild
targets Node 24. The native addon uses stable N-API v4, supported by Node 24.
Both Node 20 and Node 24 Lambda use AL2023. Before deployment, the LCA-only
`verify-node24-layer.cjs` preflight requires the Linux x64 GNU artifact, both
packaged runtime dependencies, libc symbols no newer than glibc 2.34, and an actual
Node 24 native key-to-DID smoke check. Missing/incompatible artifacts stop the action
before Serverless deployment; WASM fallback is not evidence of native compatibility.

LCA pins serverless-esbuild 1.57.2 for Node 24 target support. The service-local
`node24-runtime.cjs` plugin adds Node 24 to Serverless 3.40's older runtime schema
without disabling validation or changing other services. Deployment tools run on
Node 24.12.0 in the LCA action. Local offline configuration uses Node 24 too.

The `LcaDevBedrockGenerationPolicy` CloudFormation resource attaches the scoped
policy to `SigningAuthorityExecutionRole` only for stage `dev` in `us-east-1`.
It preserves existing grants and also covers seedMigration, which shares that role.
Production receives no new Bedrock grant from this resource. ARNs use the deployment
account and partition; source profiles/default project stay in us-east-1, and the
verified backing models are scoped to us-east-1/us-east-2/us-west-2. Short-term bearer
use, matching model/profile conditions and default-project authorization are explicit.

Owner workflow: select this branch in Deploy, target environment `staging`, and
enable only `deploy-lca-api`. The LearnCard staging leg selects GitHub environment
`learn-card-app-api-staging`; SERVERLESS_STAGE and SERVERLESS_REGION come from its
variables and must be `dev`/`us-east-1` for this policy. The action downloads/builds
the native artifact, runs the preflight, and Serverless owns role-policy and runtime
updates. Do not trigger it until the owner approves deployment. After the stack
finishes, repeat role simulations and runtime checks before separately approved
synthetic model calls. CI and native preflight do not prove live model acceptance.
