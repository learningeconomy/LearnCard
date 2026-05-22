# ADR-002: AWS KMS Latency and Batching Considerations

## Status
Proposed

## Context
The transition to AWS KMS for signing operations introduces network latency that was not present when using local environment variables. Each call to the KMS API involves a round trip to the AWS service, which can impact the performance of credential issuance, especially during bulk operations like auto-boost issuance.

## Latency Expectations
Based on AWS benchmarks and internal testing, we expect the following latency profiles for KMS signing operations:
- **Single Signing Operation**: 5-15ms per call.
- **Batch of 10 Operations**: ~100ms when processed sequentially.

Our performance target is to keep the p95 latency within 50ms of the pre-migration baseline for standard issuance flows.

## Recommendations

### 1. Batching for Bulk Issuance
For workflows involving multiple signatures, such as bulk auto-boost issuance, we recommend batching signing requests. Instead of sequential calls, the system should group requests to minimize the overhead of multiple network round trips.

### 2. Monitoring and Observability
We will use CloudWatch metrics to monitor KMS latency and error rates. Key metrics to track include:
- `KMS.Sign.Latency`: The time taken for signing operations.
- `KMS.Sign.ErrorCount`: The number of failed signing attempts.
- `KMS.ThrottlingErrorCount`: To ensure we stay within AWS service quotas.

### 3. Asynchronous Processing
Where possible, signing operations should be handled asynchronously to avoid blocking the main request thread. This is particularly important for non-critical background tasks.

## Consequences
- Increased complexity in the signing logic to support batching.
- Dependency on AWS KMS availability and performance.
- Improved security posture by keeping keys within the HSM boundary.
