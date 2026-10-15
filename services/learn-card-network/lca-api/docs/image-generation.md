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
| IMAGE_TIMEOUT_MS       | 25000                            | integer 1000–25000               |

Only the verified candidate and region are accepted for now. Additional models
require their own request/response validation. Do not choose Nova Canvas (retired
September 30, 2026). Leave production stage files unchanged until approval.
Lambda deployers can set these nonsecret values in existing stage JSON (rebuild
and deploy) or explicit Lambda environment; Docker/local may use environment.
The deadline is capped at 25 seconds, matching text generation, so the request
finishes inside the 29-second Lambda timeout (and the API Gateway HTTP API's 30-second
integration limit) rather than being killed mid-upload. Recycle functions after
configuration changes. Rollback is IMAGE_PROVIDER=openai with OPENAI_API_KEY
available. Bedrock image calls do not require an OpenAI key; since LC-2271 (#1684)
text routes use Bedrock too, so with IMAGE_PROVIDER=bedrock no LCA model call needs
OPENAI_API_KEY.

## Access and approval prerequisites

No live calls, Marketplace subscriptions/terms acceptance, IAM/security changes,
deployment, or merge were performed for this PR. An authorized operator must
verify model availability and entitlement in **us-west-2**, approve any required
Marketplace subscription/terms, and arrange model-scoped runtime access:

- Action: `bedrock:InvokeModel`
- Resource: `arn:aws:bedrock:us-west-2::foundation-model/stability.stable-image-core-v1:1`

Use the workload's normal AWS credential chain and existing execution role. The
client pins SigV4 (`authSchemePreference: ['sigv4']`), so the rotating execution-role
credentials are used and a long-term `AWS_BEARER_TOKEN_BEDROCK` API key is never
picked up, consistent with the text adapter's short-term-bearer-only policy.
`generateImage` runs in the `trpc`/`api` functions, which use
`SigningAuthorityExecutionRole`. #1684's dev-only `LcaDevBedrockGenerationPolicy`
covers only the two text inference profiles in us-east-1; it does **not** grant this
us-west-2 Stability model. Enabling Bedrock images on a stage therefore needs an
additional reviewed statement on that role (for example in the same dev-only policy):

```yaml
- Sid: StableImageCoreUsWest2
  Effect: Allow
  Action: bedrock:InvokeModel
  Resource:
      Fn::Sub: arn:${AWS::Partition}:bedrock:us-west-2::foundation-model/stability.stable-image-core-v1:1
```

No wildcard grant or IAM change is included here. Regional network connectivity
and existing Filestack storage access must also be verified by the operator.

## Behavior and evaluation

The Bedrock adapter sends one InvokeModel request with `aspect_ratio: "1:1"`
and `output_format: "png"`. It accepts exactly one successful image, validates
base64, PNG header and square dimensions (640–1536), bounds decoded bytes to
10 MiB, response bytes to 14 MiB and PNG decompression to 20 MiB, then uploads bytes through existing Filestack.
Filtering returns a sanitized BAD_REQUEST. As in text generation, provider HTTP 429
maps to TOO_MANY_REQUESTS and 503/504 to SERVICE_UNAVAILABLE; other provider, payload,
timeout and storage failures return a generic INTERNAL_SERVER_ERROR. Prompts and provider error bodies
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

This branch now contains #1684 (merged in, base `feat/lca-bedrock-lc2205`): Node 24
runtime, OpenAI SDK 6.47.0 and the Bedrock text adapter. Text routes use
`generateStructuredOutput`; the image route uses `generateStoredImage`. Neither
provider selection controls the other: `BEDROCK_BASE_URL` configures text only and
`IMAGE_PROVIDER`/`BEDROCK_IMAGE_*` configure images only.
