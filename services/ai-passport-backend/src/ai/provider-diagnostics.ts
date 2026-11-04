// Fixed metadata only. Never retain messages, stacks, arguments, schema paths or payloads.
export const PROVIDER_OPERATIONS = [
    'request',
    'tool_selection',
    'argument_parse',
    'response_validation',
] as const;
export const PROVIDER_FAILURE_REASONS = [
    'request_failed',
    'missing_tool',
    'invalid_tool',
    'arguments_json',
    'response_bounds',
    'response_shape',
    'response_value',
] as const;
export const PROVIDER_STATUSES = [
    400, 401, 403, 404, 408, 409, 413, 415, 422, 429, 500, 502, 503, 504,
] as const;
export type ProviderFailureDetails = {
    providerOperation: (typeof PROVIDER_OPERATIONS)[number];
    providerFailureReason: (typeof PROVIDER_FAILURE_REASONS)[number];
    providerStatus?: number;
};
const details = new WeakMap<object, Readonly<ProviderFailureDetails>>();
const object = (value: unknown): value is object =>
    value !== null && (typeof value === 'object' || typeof value === 'function');
export const markProviderFailure = <Value>(
    error: Value,
    metadata: ProviderFailureDetails
): Value => {
    if (object(error))
        details.set(
            error,
            Object.freeze({
                providerOperation: metadata.providerOperation,
                providerFailureReason: metadata.providerFailureReason,
                ...(metadata.providerStatus === undefined
                    ? {}
                    : { providerStatus: metadata.providerStatus }),
            })
        );
    return error;
};
export const providerFailureDetails = (
    error: unknown
): Readonly<ProviderFailureDetails> | undefined => (object(error) ? details.get(error) : undefined);
export const copyProviderFailureDetails = <Value>(source: unknown, target: Value): Value => {
    const metadata = providerFailureDetails(source);
    return metadata ? markProviderFailure(target, metadata) : target;
};
export const withProviderRequest = async <Value>(request: () => Promise<Value>): Promise<Value> => {
    try {
        return await request();
    } catch (error) {
        let status: number | undefined;
        // Official SDK APIError exposes an own scalar status. Never execute accessors.
        try {
            const value = object(error)
                ? Object.getOwnPropertyDescriptor(error, 'status')?.value
                : undefined;
            if (PROVIDER_STATUSES.some(allowed => allowed === value)) status = value;
        } catch {
            /* Metadata cannot replace the original failure. */
        }
        throw markProviderFailure(error, {
            providerOperation: 'request',
            providerFailureReason: 'request_failed',
            providerStatus: status,
        });
    }
};

export const withProviderValidation = async <Value>(
    validation: () => Promise<Value>
): Promise<Value> => {
    try {
        return await validation();
    } catch (error) {
        throw markProviderFailure(error, {
            providerOperation: 'response_validation',
            providerFailureReason: 'response_value',
        });
    }
};
