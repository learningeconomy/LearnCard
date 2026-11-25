import {
    markEmbeddingStop,
    currentEmbeddingRecovery,
    managedEmbeddingTimeout,
    retryableEmbeddingFailure,
    MANAGED_EMBEDDING_TIMEOUT_MS,
} from './embedding-recovery';
import { markEmbeddingFailure } from './embedding-diagnostics';
import { assertCurrentAiConsent } from './privacy';
import {
    BedrockRuntimeClient,
    InvokeModelCommand,
    type InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { NOVA_MODEL, assertNovaEnabled } from './embedding-generation';
import { getBedrockAuth, getBedrockSdkAuthConfig } from './bedrock-auth';
import { recordUsageRequest, reserveProviderRequest } from './usage-meter';
export type EmbeddingPurpose = 'document' | 'query';
// Every dispatch, retry and result is a provider boundary: check consent there,
// never the request's shared read. Inside one embedding AI call these checks
// share one read (oncePerAiCall); the call's own dispatch and result checks in
// client.ts still read fresh, and the next AI call reads again. Outside an AI
// call every check reads fresh, so a withdrawal between ordinals or attempts
// stops the next send.
export const assertEmbeddingConsent = () =>
    assertCurrentAiConsent('embedding', { fresh: true, oncePerAiCall: true });
export function novaPayload(text: string, purpose: EmbeddingPurpose) {
    // The conservative pilot byte bound is stricter than AWS's character bound.
    if (!text.trim() || Buffer.byteLength(text) > 4096)
        throw new Error('Embedding input empty or exceeds pilot byte bound');
    return {
        schemaVersion: 'nova-multimodal-embed-v1',
        taskType: 'SINGLE_EMBEDDING',
        singleEmbeddingParams: {
            embeddingPurpose: purpose === 'document' ? 'GENERIC_INDEX' : 'TEXT_RETRIEVAL',
            embeddingDimension: 1024,
            text: { value: text, truncationMode: 'NONE' },
        },
    };
}
export function novaVector(body: unknown): number[] {
    const rows = (
        body as {
            embeddings?: {
                embeddingType?: string;
                embedding?: unknown;
                truncatedCharLength?: number;
            }[];
        }
    )?.embeddings;
    const row = rows?.[0];
    if (
        rows?.length !== 1 ||
        row?.embeddingType !== 'TEXT' ||
        'truncatedCharLength' in row ||
        !Array.isArray(row.embedding) ||
        row.embedding.length !== 1024 ||
        !row.embedding.every(v => typeof v === 'number' && Number.isFinite(v))
    )
        throw new Error('Invalid Nova embedding envelope');
    const norm = Math.sqrt(row.embedding.reduce((n: number, v: number) => n + v * v, 0));
    if (!Number.isFinite(norm) || norm === 0) throw new Error('Invalid Nova vector norm');
    return row.embedding.map((v: number) => v / norm);
}
let client: BedrockRuntimeClient | undefined;
let managedClient: BedrockRuntimeClient | undefined;
export async function novaEmbeddings(
    texts: string[],
    purpose: EmbeddingPurpose,
    signal?: AbortSignal
): Promise<number[][]> {
    assertNovaEnabled();
    if (
        process.env.AWS_REGION !== 'us-east-1' ||
        ['AWS_ENDPOINT_URL', 'AWS_ENDPOINT_URL_BEDROCK', 'AWS_ENDPOINT_URL_BEDROCK_RUNTIME'].some(
            k => process.env[k]
        )
    )
        throw new Error('Invalid Bedrock embedding configuration');
    // Explicit auth like the guardrail clients: SigV4 on the credential chain
    // (Fly web identity), a Bedrock API key only in local development. The SDK
    // would otherwise send an empty bearer token for a blank env line.
    const auth = getBedrockSdkAuthConfig(getBedrockAuth());
    client ??= new BedrockRuntimeClient({
        region: 'us-east-1',
        ...auth,
        maxAttempts: 1,
        requestHandler: { requestTimeout: 15000, connectionTimeout: 3000 },
    });
    const recovery = purpose === 'document' ? currentEmbeddingRecovery() : undefined;
    const transport = recovery
        ? (managedClient ??= new BedrockRuntimeClient({
              region: 'us-east-1',
              ...auth,
              maxAttempts: 1,
              requestHandler: {
                  requestTimeout: MANAGED_EMBEDDING_TIMEOUT_MS,
                  // Isolate HTTP/2 streams so cancelling an attempt closes its session.
                  disableConcurrentStreams: true,
              },
          }))
        : client;
    const payloads = texts.map(text => novaPayload(text, purpose));
    // Managed credentials have exactly five ordinal requests. Run that bounded
    // group together so slow generation does not leave five serial timeouts to
    // consume the remaining record deadline. Ordinary callers stay sequential.
    if (recovery && payloads.length > 5)
        throw new Error('Managed embedding group exceeds ordinal bound');
    const group = new AbortController();
    const callerSignal = signal;
    if (recovery) signal = AbortSignal.any([group.signal, ...(signal ? [signal] : [])]);
    let firstFailure: { error: unknown } | undefined;
    const embed = async (
        payload: ReturnType<typeof novaPayload>,
        index: number
    ): Promise<number[]> => {
        let result: InvokeModelCommandOutput;
        for (;;) {
            await assertEmbeddingConsent();
            signal?.throwIfAborted();
            if (recovery)
                await recovery.reserve(
                    index + 1,
                    managedEmbeddingTimeout(recovery.deadline),
                    signal
                );
            else await reserveProviderRequest('embedding');
            // Recheck consent after durable budget/attempt reservations and backoff.
            await assertEmbeddingConsent();
            signal?.throwIfAborted();
            const attempt = new AbortController();
            const attemptSignal = recovery
                ? AbortSignal.any([attempt.signal, ...(signal ? [signal] : [])])
                : signal;
            const remaining = recovery ? managedEmbeddingTimeout(recovery.deadline) : undefined;
            const timer =
                remaining === undefined
                    ? undefined
                    : setTimeout(
                          () =>
                              attempt.abort(
                                  new DOMException(
                                      'Embedding request deadline elapsed',
                                      'TimeoutError'
                                  )
                              ),
                          remaining
                      );
            recordUsageRequest('embedding');
            const started = performance.now();
            let failure: unknown;
            try {
                result = await transport.send(
                    new InvokeModelCommand({
                        modelId: NOVA_MODEL,
                        body: JSON.stringify(payload),
                        contentType: 'application/json',
                        accept: 'application/json',
                    }),
                    {
                        abortSignal: attemptSignal,
                        ...(remaining === undefined ? {} : { requestTimeout: remaining }),
                    }
                );
                signal?.throwIfAborted();
                attemptSignal?.throwIfAborted();
                break;
            } catch (error) {
                failure =
                    attempt.signal.aborted && !signal?.aborted
                        ? Object.assign(new Error('Embedding request timeout', { cause: error }), {
                              name: 'TimeoutError',
                          })
                        : error;
                if (recovery && callerSignal?.aborted && Date.now() >= recovery.deadline)
                    markEmbeddingStop(failure, 'record_deadline');
                try {
                    markEmbeddingFailure(failure, index + 1, started, signal);
                } catch {
                    /* Preserve original failure. */
                }
            } finally {
                clearTimeout(timer);
            }
            if (!recovery || !retryableEmbeddingFailure(failure, signal)) throw failure;
            if (!(await recovery.failed(index + 1)))
                throw markEmbeddingStop(failure, 'attempts_exhausted');
        }
        await assertEmbeddingConsent();
        signal?.throwIfAborted();
        return novaVector(JSON.parse(new TextDecoder().decode(result.body)));
    };
    if (!recovery) {
        const vectors: number[][] = [];
        for (const [index, payload] of payloads.entries())
            vectors.push(await embed(payload, index));
        return vectors;
    }
    // Drain every sibling before releasing audit/owner scope or writing points.
    // Save the triggering failure, not an earlier ordinal's cancellation artifact.
    const settled = await Promise.allSettled(
        payloads.map(async (payload, index) => {
            try {
                return await embed(payload, index);
            } catch (error) {
                firstFailure ??= { error };
                group.abort(new DOMException('Embedding group stopped', 'AbortError'));
                throw error;
            }
        })
    );
    if (firstFailure) throw firstFailure.error;
    callerSignal?.throwIfAborted();
    return settled.map(result => {
        if (result.status === 'rejected') throw result.reason;
        return result.value;
    });
}
