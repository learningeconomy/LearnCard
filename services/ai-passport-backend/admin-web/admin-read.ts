import { authenticatedFetch, getDid, refreshAuth } from './auth';
import { boundedRequest } from './bounded-request';

export class AdminAccessError extends Error {}

async function readJson<T>(path: string, signal: AbortSignal): Promise<T> {
    const response = await authenticatedFetch(path, { signal });
    // Do not let a malformed/hanging error body mask a real access denial.
    if ([401, 403].includes(response.status))
        throw new AdminAccessError('Profile access changed. Log in again.');
    const value = await response.json();
    if (!response.ok) throw new Error(value.reason ?? value.error ?? 'Administration unavailable');
    return value as T;
}

export async function readAdminStatus<T>(signal: AbortSignal): Promise<T> {
    if (!(await refreshAuth(signal)) || !getDid())
        throw new AdminAccessError('Log in with the configured service profile.');
    return boundedRequest(requestSignal => readJson<T>('/admin/embeddings', requestSignal), signal);
}

export function readAdminCoverage<T>(signal: AbortSignal): Promise<T> {
    return boundedRequest(
        requestSignal => readJson<T>('/admin/embeddings/coverage', requestSignal),
        signal
    );
}
