# Backfill cost planning

The dashboard estimates model and managed privacy charges, not actual invoices
or a hard dollar spending cap. Storage, infrastructure, network and taxes are
excluded. Paid authorization and record/request limits remain separate controls.
No provider request is made to calculate an estimate.

## Public prices checked October 13, 2026

- Nova `amazon.nova-2-multimodal-embeddings-v1:0`, synchronous on-demand text in
  us-east-1: **$0.135 / million input tokens**.
  [AWS regional price list](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonBedrock/current/us-east-1/index.json),
  SKU J2D4JFVY35KCT3WP, October 10 publication, October 1 effective date.
- `us.openai.gpt-6-luna`, standard US geographic routing: **$0.11 / million
  input tokens, $0.55 / million output tokens**, at up to 272,000 input tokens.
  [AWS model pricing](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-openai-gpt-6-luna.html#model-card-openai-gpt-6-luna-pricing).
- Guardrails PII: **$0.10 / 1,000 text units**, rounded up in 1,000-character
  units per request. Other guardrail filters are rejected by the application's
  validated policy. [AWS pricing](https://aws.amazon.com/bedrock/pricing/).

These are public list prices, not negotiated account prices. No background
price refresh is performed. Recheck the sources when updating the snapshot.
Discounted asynchronous batch prices do not apply to these synchronous calls.

## Planning assumptions

Each credential attempt allows one generation request, five Nova requests and
three privacy requests: generation instructions, credential input, and the five
representations batched into one array. Messages have one embedding and one
privacy request. The SDKs do not automatically retry; explicit retries can charge
again. Existing coverage, skipped records and cache hits can reduce actual work.

- Generation input: **20,000 tokens per call**, editable for prospective batches.
  This includes transformed input, instructions and schema as an assumption.
  It is neither measured nor a guaranteed maximum. The 16,384-byte source limit
  precedes pseudonymization and cannot establish the final token count.
- Generation output: **4,096 tokens per call**, the requested output-token cap.
- Embeddings: **8,192 tokens per request**, a rounded conservative allowance,
  not measured usage. The app separately enforces a 4,096-byte text limit.
- Privacy: **100 text units per request**, based on the accepted 100,000-JavaScript-
  character payload limit. Shorter inputs generally cost less.

The stress scenario for five credential attempts gives about **$0.20**: $0.027648
embeddings + $0.022264 generation + $0.15 privacy. This is deliberately conservative,
especially privacy: all three privacy requests assume the 100,000-character
application ceiling. It is not an expected workload forecast or spending cap.
Expected cost remains unknown until representative usage is measured. Job estimates use cumulative
reserved/attempted counters, not successful writes or provider receipts.

## Observed usage and sample projections

New owner-run apply attempts record numeric aggregate response metadata only:
generation input/output tokens, privacy paid/free text units, and dispatched versus
measured request counts. No learner identity, content, response bodies or credentials
enter this ledger. No extra provider request is made. Old attempts remain unmeasured.

Nova's official [InvokeModel response schema](https://docs.aws.amazon.com/nova/latest/userguide/embeddings-schema.html)
returns embeddings without billable token usage. Nova token counts stay unknown;
bytes are not silently treated as billed tokens. Successful credential samples
require measured generation and all three privacy responses. Their planning range
combines observed generation/privacy list-price amounts with a separately stated
8,192-token allowance for every unmeasured Nova request. This is not a fully measured
per-record total, statistical confidence interval, invoice or guaranteed cost bound.

Sample size, historical gaps, failed attempts and missing response usage are shown.
Only successful credential attempts enter the forecast; failures/retries may cost
extra and their measured usage still contributes to the recorded known subtotal.
A process crash or cancellation may prevent persistence, so this is not billing
reconciliation. Source/provider behavior is not changed to obtain telemetry.
Prices are matched to their snapshot; model/rate changes disable reuse of prior
samples. Generation inputs above 272,000 tokens use the verified higher Luna tier
($0.22/M input and $0.825/M output). Cache discounts, negotiated rates and taxes are
not inferred: the display values response usage at public list rates.

## Configuration and unknown prices

The server's configured region and TITLE_MODEL select prices, independently of
the active search/read provider. Recognized Luna aliases and the approved US
endpoint receive public generation pricing. Unsupported model, region or endpoint
configurations show affected components as unknown, never an embedding-only total.
No raw override, endpoint, credential or guardrail identifier is returned.

Explicit rate overrides are not silently replaced. Embedding overrides require a
rate matching the verified $0.135/M snapshot and its exact regional price-list URL.
Legacy per-call generation overrides lack model binding and token basis, so their
generation estimate remains unknown until those settings are reviewed. Deployment
settings are operator-controlled and are not changed by this patch.
