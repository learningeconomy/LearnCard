# Bedrock text generation (LC-2205)

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
and invocation-logging posture before learner traffic. This PR does not change IAM,
networking, security settings or infrastructure and does not port AI Passport's
application-specific privacy gateway into LCA. US profiles can route across US regions;
the endpoint is not a single-region processing guarantee.

[LearnCard PR1670](https://github.com/learningeconomy/LearnCard/pull/1670) was still open
at `5e8ef2065fba33d1a793fc890702f902f3fc82a6` during implementation. This branch starts
from main `77e5b0681`, retaining its current runtime-secrets bootstrap. If PR1670 lands
first, reconcile the optional endpoint into its service-config/function-env conventions
and regenerate the lockfile on the resulting base; retain `CONFIG_TENANT`, tenant/stage
selection and bundle precedence. There is no new bearer-token secret to provision.
The earlier request-changes review at `098e98c` flagged tenant-blind credential-refresh
preflight and stale `CONFIG_TENANT` deployment-contract expectations. Those issues are
owned by PR1670; this migration does not repair or revert them.

Rollback uses the prior application revision with its prior OpenAI credential, after
explicit deployment approval. There is no runtime silent fallback to the old models.
