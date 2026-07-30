/**
 * Browser-side client for the playground's HTTP API. Hides the
 * server's wire shape from React components.
 */
import type { ProviderId } from './scenarios';

export interface LaunchSuccess {
    kind: 'vci' | 'vp';
    /** The full deep-link URI ready to copy or QR-encode. */
    uri: string;
    deepLink: string;
    /** Verifier session state (VP only) used by the status poller. */
    state?: string;
    label: string;
    scenarioId: string;
}

export interface StatusResult {
    status: 'pending' | 'success' | 'fail';
    detail?: string;
}

export const launchScenario = async (
    providerId: ProviderId,
    scenarioId: string
): Promise<LaunchSuccess> => {
    const res = await fetch('/api/launch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ providerId, scenarioId }),
    });

    if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(
            errBody.error
                || `Launch failed with HTTP ${res.status} (is the walt.id Docker stack running?)`
        );
    }

    return (await res.json()) as LaunchSuccess;
};

export const fetchStatus = async (
    providerId: ProviderId,
    kind: 'vci' | 'vp',
    state: string | undefined
): Promise<StatusResult> => {
    const params = new URLSearchParams({ providerId, kind });
    if (state) params.set('state', state);

    const res = await fetch(`/api/status?${params.toString()}`);
    if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(errBody.error || `Status check failed (HTTP ${res.status})`);
    }
    return (await res.json()) as StatusResult;
};
