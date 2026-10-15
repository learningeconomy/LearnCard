# Configurable image generation

`ai.generateImage({ prompt })` still requires a nonempty prompt and returns `{ url }`.
The LCA SDK still returns the URL string. Text generation is unchanged.
Amazon Bedrock Stable Image Core (`stability.stable-image-core-v1:1`, us-west-2) is
the default provider, so with LC-2271 every LCA model call goes through Bedrock.
Output intentionally differs from DALL-E (different model and style); the contract
is unchanged: one square PNG, uploaded through Filestack, returned as `{ url }`.
DALL-E 3 (one 1024 × 1024 image, URL stored through Filestack) remains available
only as an explicit fallback with `IMAGE_PROVIDER=openai`.

## Configuration

Use the existing service-config layering: schema defaults → base/stage JSON →
runtime secrets bundle → explicit nonempty environment. No new secrets loader is added.

| Setting                | Default                          | Allowed values                   |
| ---------------------- | -------------------------------- | -------------------------------- |
| IMAGE_PROVIDER         | bedrock                          | bedrock, openai                  |
| BEDROCK_IMAGE_REGION   | us-west-2                        | us-west-2                        |
| BEDROCK_IMAGE_MODEL_ID | stability.stable-image-core-v1:1 | stability.stable-image-core-v1:1 |
| IMAGE_TIMEOUT_MS       | 25000                            | integer 1000–25000               |

Only the verified candidate and region are accepted for now. Additional models
require their own request/response validation. Do not choose Nova Canvas (retired
September 30, 2026). Lambda deployers can set these nonsecret values in existing stage JSON (rebuild
and deploy) or explicit Lambda environment; Docker/local may use environment.
The deadline is capped at 25 seconds, matching text generation, so the request
finishes inside the 29-second Lambda timeout (and the API Gateway HTTP API's 30-second
integration limit) rather than being killed mid-upload. Recycle functions after
configuration changes.

`OPENAI_API_KEY` is now only needed for the DALL-E fallback (`IMAGE_PROVIDER=openai`).
Text routes use Bedrock since LC-2271 (#1684) and the default image provider uses
Bedrock, so with the defaults no LCA model call needs an OpenAI key. To fall back
(e.g. rollback), set `IMAGE_PROVIDER=openai` in the stage JSON or runtime-secrets
bundle and make sure `OPENAI_API_KEY` is available, then recycle the functions.
There is no automatic fallback between providers.

## Access and approval prerequisites

Because Bedrock is the default, every stage that deploys this code needs the
following before `generateImage` will work (otherwise it returns the sanitized
INTERNAL_SERVER_ERROR). No live calls, Marketplace subscriptions/terms acceptance,
IAM/security changes, deployment, or merge were performed for this PR. An
authorized operator must verify model availability and entitlement in
**us-west-2**, approve any required Marketplace subscription/terms, and arrange
model-scoped runtime access:

- Action: `bedrock:InvokeModel`
- Resource: `arn:aws:bedrock:us-west-2::foundation-model/stability.stable-image-core-v1:1`

Use the workload's normal AWS credential chain and existing execution role. The
client pins SigV4 (`authSchemePreference: ['sigv4']`), so the rotating execution-role
credentials are used and a long-term `AWS_BEARER_TOKEN_BEDROCK` API key is never
picked up, consistent with the text adapter's short-term-bearer-only policy.
`generateImage` runs in the `trpc`/`api` functions, which use
`SigningAuthorityExecutionRole`. #1684's dev-only `LcaDevBedrockGenerationPolicy`
covers only the two text inference profiles in us-east-1; it does **not** grant this
us-west-2 Stability model, and production has no Bedrock grant at all. Each stage
therefore needs an additional reviewed statement on that role, for example:

```yaml
- Sid: StableImageCoreUsWest2
  Effect: Allow
  Action: bedrock:InvokeModel
  Resource:
      Fn::Sub: arn:${AWS::Partition}:bedrock:us-west-2::foundation-model/stability.stable-image-core-v1:1
```

No wildcard grant or IAM change is included in this PR; the grant is managed
separately. Regional network connectivity (NAT egress from the VPC Lambdas to
`bedrock-runtime.us-west-2.amazonaws.com`) and existing Filestack storage access
must also be verified by the operator.

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

Output differing from DALL-E is accepted. Before learner traffic, still smoke-test
a small fixed prompt set on staging for badge/icon readability, filter behavior,
latency, failure rate and actual storage/display behavior. Verify current
[Bedrock pricing](https://aws.amazon.com/bedrock/pricing/) in the target region
and model before any calls; record invocation count and total cost, including
failed or timed-out requests.

Request/response fields were checked against the
[AWS Stable Image Core documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-diffusion-stable-image-core-text-image-request-response.html).

## Integration with text LLM PR #1684

This branch now contains #1684 (merged in, base `feat/lca-bedrock-lc2205`): Node 24
runtime, OpenAI SDK 6.47.0 and the Bedrock text adapter. Text routes use
`generateStructuredOutput`; the image route uses `generateStoredImage`. Neither
provider selection controls the other: `BEDROCK_BASE_URL` configures text only and
`IMAGE_PROVIDER`/`BEDROCK_IMAGE_*` configure images only.
