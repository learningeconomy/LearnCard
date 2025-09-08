import { LearnCard } from '@learncard/core';
import { UnsignedVC, VC } from '@learncard/types';

import {
    OpenBadgeV2Plugin,
    OBV2_WRAPPER_CONTEXT_URL,
    OpenBadgeV2PluginDependentMethods,
} from './types';

const VC_V2_CONTEXT = 'https://www.w3.org/ns/credentials/v2';

const isUrl = (value: string): boolean =>
    /^(https?:)?\/\//i.test(value) || value.startsWith('ipfs://') || value.startsWith('ipns://');

const isValidAndSafeUrl = (url: string): void => {
    try {
        const parsedUrl = new URL(url);

        // Only allow http, https, ipfs, ipns protocols
        const allowedProtocols = ['https:', 'http:', 'ipfs:', 'ipns:'];
        if (!allowedProtocols.includes(parsedUrl.protocol)) {
            throw new Error(
                `wrapOpenBadgeV2: Protocol '${parsedUrl.protocol}' is not allowed. Only HTTP(S), IPFS, and IPNS are supported`
            );
        }

        // Skip internal network checks for IPFS/IPNS as they don't use traditional IP addresses
        if (parsedUrl.protocol === 'ipfs:' || parsedUrl.protocol === 'ipns:') {
            return;
        }

        // Block localhost and internal networks for HTTP(S)
        const hostname = parsedUrl.hostname.toLowerCase();

        // Block localhost variations
        if (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '0.0.0.0' ||
            hostname === '::1'
        ) {
            throw new Error('wrapOpenBadgeV2: Access to localhost is not allowed');
        }

        // Block private IP ranges (RFC 1918)
        if (
            hostname.startsWith('10.') ||
            hostname.startsWith('192.168.') ||
            (hostname.startsWith('172.') && /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname))
        ) {
            throw new Error('wrapOpenBadgeV2: Access to private IP ranges is not allowed');
        }

        // Block link-local addresses
        if (hostname.startsWith('169.254.')) {
            throw new Error('wrapOpenBadgeV2: Access to link-local addresses is not allowed');
        }
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error('wrapOpenBadgeV2: Invalid URL format');
        }
        throw error;
    }
};

async function getObv2Assertion(input: object | string): Promise<Record<string, any>> {
    if (typeof input === 'string') {
        // Treat string as URL. If it looks like raw JSON, try to parse for developer ergonomics
        const trimmed = input.trim();
        if (!isUrl(trimmed) && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
            try {
                return JSON.parse(trimmed);
            } catch (e) {
                throw new Error('wrapOpenBadgeV2: Provided string is not a valid URL or JSON');
            }
        }

        // Validate URL for security
        isValidAndSafeUrl(trimmed);

        try {
            // Add timeout to prevent hanging requests (10 seconds)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const res = await fetch(trimmed, {
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!res.ok)
                throw new Error(`wrapOpenBadgeV2: Failed to fetch OBv2 assertion: ${res.status}`);

            return await res.json();
        } catch (error: any) {
            if (error instanceof TypeError) {
                throw new Error(
                    `wrapOpenBadgeV2: Network error while fetching OBv2 assertion: ${error.message}`
                );
            }
            if (error?.name === 'AbortError') {
                throw new Error('wrapOpenBadgeV2: Request timed out after 10 seconds');
            }
            throw error;
        }
    }

    // Add basic type validation before assertion
    if (typeof input !== 'object' || input === null) {
        throw new Error('wrapOpenBadgeV2: Input must be a valid object');
    }

    return input as Record<string, any>;
}

function validateObv2(obv2: Record<string, any>): void {
    if (!obv2 || typeof obv2 !== 'object') throw new Error('wrapOpenBadgeV2: Missing assertion');

    const id = obv2.id;
    if (typeof id !== 'string' || !id.length)
        throw new Error('wrapOpenBadgeV2: assertion.id is required');

    const t = obv2.type;
    const hasAssertionType =
        (typeof t === 'string' && t === 'Assertion') ||
        (Array.isArray(t) && t.includes('Assertion'));
    if (!hasAssertionType)
        throw new Error("wrapOpenBadgeV2: assertion.type must include 'Assertion'");

    if (!obv2.issuedOn || typeof obv2.issuedOn !== 'string') {
        throw new Error('wrapOpenBadgeV2: assertion.issuedOn (string) is required');
    }
}

export const openBadgeV2Plugin = (
    learnCard: LearnCard<any, 'id', OpenBadgeV2PluginDependentMethods>
): OpenBadgeV2Plugin => ({
    name: 'OpenBadgeV2',
    displayName: 'OpenBadge v2 Wrapper',
    description: 'Wrap legacy OpenBadge v2.0 assertions into self-issued Verifiable Credentials',
    methods: {
        wrapOpenBadgeV2: async (_learnCard, obv2Assertion: object | string): Promise<VC> => {
            const issuerDid = learnCard.id.did();

            const obv2 = await getObv2Assertion(obv2Assertion);
            validateObv2(obv2);

            const unsigned: UnsignedVC = {
                '@context': [VC_V2_CONTEXT, OBV2_WRAPPER_CONTEXT_URL],
                id: `urn:uuid:${_learnCard.invoke.crypto().randomUUID()}`,
                type: ['VerifiableCredential', 'LegacyOpenBadgeCredential'],
                issuer: issuerDid,
                validFrom: new Date().toISOString(),
                credentialSubject: {
                    id: issuerDid,
                },
                legacyAssertion: obv2,
            };

            return learnCard.invoke.issueCredential(unsigned, { proofPurpose: 'assertionMethod' });
        },
    },
});
