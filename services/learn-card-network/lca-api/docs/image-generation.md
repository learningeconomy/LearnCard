# Configurable image generation

`ai.generateImage({ prompt })` still requires a nonempty prompt and returns `{ url }`.
The LCA SDK still returns the URL string. Text generation is unchanged.
DALL-E 3 remains the default (one 1024 × 1024 image, URL stored through Filestack).
Stable Image Core is an opt-in candidate, not a proven quality replacement.

## Configuration for a later approved evaluation

Use the existing service-config layering: schema defaults → base/stage JSON →
runtime secrets bundle → explicit nonempty environment. No new secrets loader is added.

| Setting                | Default                          | Allowed values                   |
| ---------------------- | -------------------------------- | -------------------------------- |
| IMAGE_PROVIDER         | openai                           | openai, bedrock                  |
| BEDROCK_IMAGE_REGION   | us-west-2                        | us-west-2                        |
| BEDROCK_IMAGE_MODEL_ID | stability.stable-image-core-v1:1 | stability.stable-image-core-v1:1 |
| IMAGE_TIMEOUT_MS       | 90000                            | integer 1000–120000              |

Only the verified candidate and region are accepted for now. Additional models
require their own request/response validation. Do not choose Nova Canvas (retired
September 30, 2026). Leave production stage files unchanged until approval.
Lambda deployers can set these nonsecret values in existing stage JSON (rebuild
and deploy) or explicit Lambda environment; Docker/local may use environment.
Check API gateway/function timeouts separately before evaluation; a request can
outlive an upstream disconnect. Recycle functions after configuration changes.
Rollback is IMAGE_PROVIDER=openai with OPENAI_API_KEY available. Bedrock image
calls do not require an OpenAI key; normal text routes still do.

## Access and approval prerequisites

No live calls, Marketplace subscriptions/terms acceptance, IAM/security changes,
deployment, or merge were performed for this PR. An authorized operator must
verify model availability and entitlement in **us-west-2**, approve any required
Marketplace subscription/terms, and arrange model-scoped runtime access:

- Action: `bedrock:InvokeModel`
- Resource: `arn:aws:bedrock:us-west-2::foundation-model/stability.stable-image-core-v1:1`

Use the workload's normal AWS credential chain and existing execution role.
No wildcard grant or IAM change is included here. Regional network connectivity
and existing Filestack storage access must also be verified by the operator.

## Behavior and evaluation

The Bedrock adapter sends one InvokeModel request with `aspect_ratio: "1:1"`
and `output_format: "png"`. It accepts exactly one successful image, validates
base64, PNG header and square dimensions (640–1536), bounds decoded bytes to
10 MiB, response bytes to 14 MiB and PNG decompression to 20 MiB, then uploads bytes through existing Filestack.
Filtering returns a sanitized BAD_REQUEST; provider, payload, timeout, and storage
failures return a generic INTERNAL_SERVER_ERROR. Prompts and provider error bodies
are not logged or returned. A deadline bounds the request and aborts model work;
storage already in flight may finish after the deadline. No automatic provider
fallback is present. SDK model retries are disabled for both image providers;
a manual retry after timeout may still incur another charge.

Before changing the default, obtain explicit approval for a small fixed prompt
set, budget and access. Compare candidate vs DALL-E on badge/icon readability,
prompt adherence, visual consistency, unwanted text, safety/filter behavior,
latency, failure rate and actual storage/display behavior. Verify current
[Bedrock pricing](https://aws.amazon.com/bedrock/pricing/) in the target region
and model before any calls; record invocation count and total cost, including
failed or timed-out requests. Obtain quality signoff and deployment approval.

Request/response fields were checked against the
[AWS Stable Image Core documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-diffusion-stable-image-core-text-image-request-response.html).

## Integration with text LLM PR #1684

This PR branches from current main independently. Both PRs may touch
`src/routes/ai.ts`, `src/config/environment.ts`, the service package manifest and
`bun.lock`. Resolve by retaining both sets of fields and dependencies, regenerating
the lockfile, and keeping text generation calls on the text adapter and the image
route on `generateStoredImage`. Neither provider selection controls the other.
Run both adapters' mocked tests and service typecheck after combining.
