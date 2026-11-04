// Fixed recovery evidence only; no provider text, payloads, or identifiers.
export const GENERATION_FAILURES = ['provider_timeout', 'caller_aborted'] as const;
export type GenerationFailure = (typeof GENERATION_FAILURES)[number];
const failures = new WeakMap<object, GenerationFailure>();
export function markGenerationFailure(error: unknown, failure: GenerationFailure) {
    if (error !== null && typeof error === 'object') failures.set(error, failure);
}
export function generationFailureDetails(error: unknown) {
    return error !== null && typeof error === 'object' ? failures.get(error) : undefined;
}
export function copyGenerationFailure(source: unknown, target: object) {
    const failure = generationFailureDetails(source);
    if (failure) failures.set(target, failure);
}
