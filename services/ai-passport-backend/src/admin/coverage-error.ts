/** Static diagnostics only; never expose provider/Mongo messages or identifiers. */
export function coverageFailureReason(error: unknown): string {
    if (error instanceof CoverageObservationError) {
        const underlying = coverageFailureReason(error.cause);
        const labels = {
            database: 'Database connection',
            'source-read': 'Source metadata read',
            'change-stream': 'Change-stream observation',
            'vector-schema': 'Vector schema observation',
            'vector-read': 'Vector observation',
            'owner-fence': 'Owner deletion fence observation',
        };
        return `${labels[error.stage]} failed. ${underlying}`;
    }
    const e = error as { code?: number; name?: string; message?: string } | null;
    if (e?.code === 13 || e?.code === 18) return 'Inventory database authorization unavailable';
    if (e?.code === 40573) return 'Inventory requires working replica-set change streams';
    if (e?.code === 280 || e?.code === 286) return 'Inventory change-stream continuity unavailable';
    if (
        e?.code === 50 ||
        ['MongoNetworkTimeoutError', 'MongoServerSelectionError'].includes(e?.name ?? '')
    )
        return 'Inventory database connection or deadline unavailable';
    if (e?.message === 'Incompatible coverage vector schema')
        return 'Inventory vector schema incompatible';
    if (
        e?.message === 'Coverage inventory exceeds capacity' ||
        e?.message === 'Coverage change backlog exceeds capacity'
    )
        return 'Inventory safety capacity exceeded';
    return 'Inventory observation unavailable; database/change-stream/vector checks failed';
}

export type CoverageStage =
    'database' | 'source-read' | 'change-stream' | 'vector-schema' | 'vector-read' | 'owner-fence';
export class CoverageObservationError extends Error {
    constructor(
        readonly stage: CoverageStage,
        readonly cause: unknown,
        readonly vectorContext?: { generation: string; view: string }
    ) {
        super('Coverage observation failed');
    }
}
export async function observeCoverageStage<T>(
    stage: CoverageStage,
    action: () => Promise<T>,
    vectorContext?: { generation: string; view: string }
): Promise<T> {
    try {
        return await action();
    } catch (error) {
        throw new CoverageObservationError(stage, error, vectorContext);
    }
}

// Return only finite, static labels. In particular, never return the physical
// collection name (which contains a deployment prefix), message, URL or body.
const vectorGenerations = ['openai1536', 'nova1024v1'] as const;
const vectorViews = [
    'FULL_TEXT',
    'DOMAIN_SUMMARY',
    'KEY_CLAIMS',
    'TECHNICAL_METADATA',
    'COMPARISON_CONTEXT',
] as const;
const vectorHttpCategories = {
    400: 'invalid_request',
    401: 'authorization',
    403: 'authorization',
    404: 'not_found',
    408: 'timeout',
    409: 'conflict',
    422: 'invalid_request',
    429: 'rate_limited',
    500: 'unavailable',
    502: 'unavailable',
    503: 'unavailable',
    504: 'timeout',
} as const;

export function coverageVectorFailure(error: unknown) {
    if (
        !(error instanceof CoverageObservationError) ||
        !['vector-schema', 'vector-read'].includes(error.stage)
    )
        return undefined;
    const generation =
        vectorGenerations.find(value => value === error.vectorContext?.generation) ?? 'unknown';
    const view = vectorViews.find(value => value === error.vectorContext?.view) ?? 'unknown';
    const cause = error.cause as {
        status?: unknown;
        name?: unknown;
        code?: unknown;
        cause?: { code?: unknown };
    } | null;
    // @qdrant/openapi-typescript-fetch ApiError exposes a numeric top-level status.
    const status = cause?.status;
    if (typeof status === 'number' && Object.hasOwn(vectorHttpCategories, status))
        return {
            generation,
            view,
            category: vectorHttpCategories[status as keyof typeof vectorHttpCategories],
            httpStatus: status,
        };
    if (cause?.name === 'QdrantClientResourceExhaustedError')
        return { generation, view, category: 'rate_limited' };
    const code = cause?.code ?? cause?.cause?.code;
    const timeout =
        cause?.name === 'AbortError' ||
        cause?.name === 'TimeoutError' ||
        cause?.name === 'QdrantClientTimeoutError' ||
        code === 'ETIMEDOUT' ||
        code === 'UND_ERR_CONNECT_TIMEOUT' ||
        code === 'UND_ERR_HEADERS_TIMEOUT' ||
        code === 'UND_ERR_BODY_TIMEOUT';
    const network =
        code === 'ECONNREFUSED' ||
        code === 'ECONNRESET' ||
        code === 'ENOTFOUND' ||
        code === 'EAI_AGAIN';
    return {
        generation,
        view,
        category: timeout ? 'timeout' : network ? 'network' : 'unknown',
    };
}
export function coverageFailureStage(error: unknown): CoverageStage | 'unknown' {
    return error instanceof CoverageObservationError ? error.stage : 'unknown';
}
