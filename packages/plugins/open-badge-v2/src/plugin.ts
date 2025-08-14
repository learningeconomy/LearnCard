import { LearnCard } from '@learncard/core';
import { UnsignedVC, VC } from '@learncard/types';
import { VCPluginMethods } from '@learncard/vc-plugin';

import {
    OpenBadgeV2Plugin,
    OpenBadgeV2PluginMethods,
    OBV2_WRAPPER_CONTEXT_URL,
} from './types';

const VC_V2_CONTEXT = 'https://www.w3.org/ns/credentials/v2';

const isUrl = (value: string): boolean =>
    /^(https?:)?\/\//i.test(value) || value.startsWith('ipfs://') || value.startsWith('ipns://');

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

        const res = await fetch(trimmed);
        if (!res.ok) throw new Error(`wrapOpenBadgeV2: Failed to fetch OBv2 assertion: ${res.status}`);

        return await res.json();
    }

    return input as Record<string, any>;
}

function validateObv2(obv2: Record<string, any>): void {
    if (!obv2 || typeof obv2 !== 'object') throw new Error('wrapOpenBadgeV2: Missing assertion');

    const id = obv2.id;
    if (typeof id !== 'string' || !id.length) throw new Error('wrapOpenBadgeV2: assertion.id is required');

    const t = obv2.type;
    const hasAssertionType =
        (typeof t === 'string' && t === 'Assertion') ||
        (Array.isArray(t) && t.includes('Assertion'));
    if (!hasAssertionType) throw new Error("wrapOpenBadgeV2: assertion.type must include 'Assertion'");

    if (!obv2.issuedOn || typeof obv2.issuedOn !== 'string') {
        throw new Error('wrapOpenBadgeV2: assertion.issuedOn (string) is required');
    }
}

export const openBadgeV2Plugin = (
    learnCard: LearnCard<any, 'id', VCPluginMethods>
): OpenBadgeV2Plugin => ({
    name: 'OpenBadgeV2',
    displayName: 'OpenBadge v2 Wrapper',
    description: 'Wrap legacy OpenBadge v2.0 assertions into self-issued Verifiable Credentials',
    methods: {
        wrapOpenBadgeV2: async (
            _learnCard,
            obv2Assertion: object | string
        ): Promise<VC> => {
            const issuerDid = learnCard.id.did();

            const obv2 = await getObv2Assertion(obv2Assertion);
            validateObv2(obv2);

            const unsigned: UnsignedVC = {
                '@context': [VC_V2_CONTEXT, OBV2_WRAPPER_CONTEXT_URL],
                id: `urn:uuid:${crypto.randomUUID()}`,
                type: ['VerifiableCredential', 'LegacyOpenBadgeCredential'],
                issuer: issuerDid,
                validFrom: new Date().toISOString(),
                credentialSubject: {
                    id: issuerDid,
                    legacyAssertion: obv2,
                },
            };

            return learnCard.invoke.issueCredential(unsigned, { proofPurpose: 'assertionMethod' });
        },
    },
});
