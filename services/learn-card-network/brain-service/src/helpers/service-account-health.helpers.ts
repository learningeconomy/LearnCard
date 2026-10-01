import { randomUUID } from 'node:crypto';
import { lookup } from 'node:dns';
import { isIP } from 'node:net';
// Explicit package entry avoids Bun's built-in `undici` shim, which ignores
// dispatchers and would bypass the connection-time DNS policy.
import { Agent, fetch, type RequestInit } from 'undici/index.js';
import Ajv from 'ajv';
import type { ServiceAccount } from '@learncard/types';
import { environment } from '@environment';
import { signServiceAccountProbe } from './service-account-auth.helpers';

export const publicProbeAddress = (address: string): boolean => {
    if (isIP(address) === 6)
        return /^[23][0-9a-f]{3}:/i.test(address) && !address.toLowerCase().startsWith('2001:db8:');
    if (isIP(address) !== 4) return false;
    const [a = 0, b = 0] = address.split('.').map(Number);
    return (
        a !== 0 &&
        a !== 10 &&
        a !== 127 &&
        a < 224 &&
        !(a === 169 && b === 254) &&
        !(a === 172 && b >= 16 && b <= 31) &&
        !(a === 192 && (b === 168 || b === 0)) &&
        !(a === 100 && b >= 64 && b <= 127) &&
        !(a === 198 && (b === 18 || b === 19))
    );
};

// Resolve and validate on the actual connection, not in a separate preflight
// susceptible to DNS rebinding. Reject mixed public/private answer sets.
const publicProbeAgent = new Agent({
    connect: {
        lookup: (hostname, options, callback) => {
            lookup(hostname, { all: true }, (error, addresses) => {
                if (
                    error ||
                    !addresses.length ||
                    addresses.some(item => !publicProbeAddress(item.address))
                ) {
                    callback(
                        error ?? new Error('Health endpoint must resolve to public addresses'),
                        '',
                        4
                    );
                } else if (options.all) {
                    callback(null, addresses);
                } else {
                    callback(null, addresses[0]!.address, addresses[0]!.family);
                }
            });
        },
    },
});

/** Unsupported JSON Schema features fail closed rather than being ignored. */
export const integrationConfigValid = (
    schema: Record<string, unknown> | undefined,
    config: unknown
): boolean => {
    if (!schema) return true;
    try {
        return (
            new Ajv({ strict: true, strictRequired: false, validateFormats: true }).validate(
                schema,
                config
            ) === true
        );
    } catch {
        return false;
    }
};

export const integrationHealthUrlAllowed = (value: string): boolean => {
    try {
        const url = new URL(value);
        const hostname = url.hostname.replace(/^\[|\]$/g, '');
        if (
            url.protocol === 'https:' &&
            (hostname === 'localhost' || (isIP(hostname) && !publicProbeAddress(hostname)))
        )
            return false;
        return (
            !url.username &&
            !url.password &&
            !url.hash &&
            (url.protocol === 'https:' ||
                (environment.NODE_ENV === 'test' &&
                    url.protocol === 'http:' &&
                    url.hostname === 'localhost'))
        );
    } catch {
        return false;
    }
};

/** Only call with the pinned signed manifest's endpoint, never requested config. */
export const probeIntegrationHealth = async (
    account: ServiceAccount,
    healthUrl: string
): Promise<boolean> => {
    if (!integrationHealthUrlAllowed(healthUrl)) return false;
    const nonce = randomUUID();
    try {
        const challenge = await signServiceAccountProbe(account, healthUrl, nonce);
        const options: RequestInit & { dispatcher?: Agent } = {
            method: 'GET',
            redirect: 'error',
            signal: AbortSignal.timeout(2000),
            headers: { 'x-educationos-health-challenge': challenge },
            ...(new URL(healthUrl).protocol === 'https:' ? { dispatcher: publicProbeAgent } : {}),
        };
        const response = await fetch(healthUrl, options);
        // The partner verifies the JWT with the pinned platform key, then echoes
        // its jti. HTTPS authenticates the responder; echo binds it to this probe.
        const healthy =
            response.ok && response.headers.get('x-educationos-health-response') === nonce;
        await response.body?.cancel();
        return healthy;
    } catch {
        return false;
    }
};
