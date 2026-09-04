// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import {
    getIssuerContextLabel,
    getIssuerContextName,
    resolveIssuerContext,
    type ResolveIssuerContextInput,
} from '../helpers/issuerContext.helpers';

const relationship: NonNullable<ResolveIssuerContextInput['relationship']> = {
    profile: {
        profileId: 'issuer',
        displayName: 'Charles Henway',
        image: 'https://example.com/charles.png',
    },
    connectionStatus: 'NOT_CONNECTED',
    mutualConnectionCount: 0,
    hasVerifiedContactMethod: false,
};

const createInput = (
    overrides: Partial<ResolveIssuerContextInput> = {}
): ResolveIssuerContextInput => ({
    issuerDid: 'did:key:issuer',
    holderDid: 'did:key:holder',
    trustProfile: 'social',
    registrySource: 'unknown',
    isAppIssuer: false,
    relationship,
    ...overrides,
});

describe('resolveIssuerContext', () => {
    it.each([
        {
            state: 'denied',
            input: createInput({
                registrySource: 'untrusted',
                relationship: { ...relationship, connectionStatus: 'CONNECTED' },
            }),
        },
        {
            state: 'self',
            input: createInput({ issuerDid: 'did:key:holder' }),
        },
        {
            state: 'trusted',
            input: createInput({
                registrySource: 'trusted',
                relationship: { ...relationship, connectionStatus: 'CONNECTED' },
            }),
        },
        {
            state: 'app',
            input: createInput({ isAppIssuer: true }),
        },
        {
            state: 'connection',
            input: createInput({
                relationship: { ...relationship, connectionStatus: 'CONNECTED' },
            }),
        },
        {
            state: 'mutuals',
            input: createInput({
                relationship: { ...relationship, mutualConnectionCount: 4 },
            }),
        },
        {
            state: 'identified',
            input: createInput({
                relationship: { ...relationship, hasVerifiedContactMethod: true },
            }),
        },
        {
            state: 'unclaimed',
            input: createInput(),
        },
        {
            state: 'unresolvable',
            input: createInput({ relationship: undefined }),
        },
    ] as const)('resolves the $state row', ({ state, input }) => {
        expect(resolveIssuerContext(input)).toMatchObject({ state, trustProfile: 'social' });
    });

    it('enforces denylist > self > registry > relationship precedence', () => {
        const connectedRelationship = { ...relationship, connectionStatus: 'CONNECTED' as const };

        expect(
            resolveIssuerContext(
                createInput({
                    issuerDid: 'did:key:holder',
                    registrySource: 'untrusted',
                    relationship: connectedRelationship,
                })
            ).state
        ).toBe('denied');
        expect(
            resolveIssuerContext(
                createInput({
                    issuerDid: 'did:key:holder',
                    registrySource: 'trusted',
                    relationship: connectedRelationship,
                })
            ).state
        ).toBe('self');
        expect(
            resolveIssuerContext(
                createInput({
                    registrySource: 'trusted',
                    relationship: connectedRelationship,
                })
            ).state
        ).toBe('trusted');
    });

    it('keeps institutional credentials on institutional framing', () => {
        expect(
            resolveIssuerContext(createInput({ trustProfile: 'credential', relationship }))
        ).toMatchObject({ state: 'unresolvable', trustProfile: 'credential' });
    });
});

describe('getIssuerContextName', () => {
    const context = resolveIssuerContext(createInput());

    it('uses the exact override before profile names', () => {
        expect(getIssuerContextName(context, 'Registry Issuer')).toBe('Registry Issuer');
    });

    it('falls back to the resolved profile name', () => {
        expect(getIssuerContextName(context)).toBe('Charles Henway');
    });
});

describe('getIssuerContextLabel', () => {
    const t = (key: string, params?: Record<string, unknown>): string => {
        const values: Record<string, string> = {
            'verification.youCreatedThis': 'You created this',
            'verification.fromConnection': `From your connection: ${params?.name ?? ''}`,
            'verification.knownByConnections': `Known by ${params?.count ?? 0} of your connections`,
            'verification.verifiedProfile': `${params?.name ?? ''}: Verified profile`,
            'verification.unverifiedProfile': `${params?.name ?? ''}: Unverified profile`,
            'verification.issuerUnidentified': 'Issuer could not be identified',
            'verification.unknownIssuer': 'Unknown Issuer',
        };

        return values[key] ?? key;
    };

    it.each([
        {
            state: 'self',
            expected: 'You created this',
            input: createInput({ issuerDid: 'did:key:holder' }),
        },
        {
            state: 'connection',
            expected: 'From your connection: Charles Henway',
            input: createInput({
                relationship: { ...relationship, connectionStatus: 'CONNECTED' },
            }),
        },
        {
            state: 'mutuals',
            expected: 'Known by 4 of your connections',
            input: createInput({
                relationship: { ...relationship, mutualConnectionCount: 4 },
            }),
        },
        {
            state: 'identified',
            expected: 'Charles Henway: Verified profile',
            input: createInput({
                relationship: { ...relationship, hasVerifiedContactMethod: true },
            }),
        },
        {
            state: 'unclaimed',
            expected: 'Charles Henway: Unverified profile',
            input: createInput(),
        },
        {
            state: 'unresolvable',
            expected: 'Issuer could not be identified',
            input: createInput({ relationship: undefined }),
        },
        {
            state: 'unresolvable credential',
            expected: 'Unknown Issuer',
            input: createInput({ trustProfile: 'credential' }),
        },
    ] as const)('labels $state issuer context', ({ expected, input }) => {
        expect(getIssuerContextLabel(resolveIssuerContext(input), t)).toBe(expected);
    });

    it('uses role labels without changing relationship or denylist semantics', () => {
        const denied = resolveIssuerContext(
            createInput({ registrySource: 'untrusted', trustProfile: 'credential' })
        );
        const institutional = resolveIssuerContext(
            createInput({ trustProfile: 'credential', relationship: undefined })
        );
        const connected = resolveIssuerContext(
            createInput({
                relationship: { ...relationship, connectionStatus: 'CONNECTED' },
            })
        );

        expect(getIssuerContextLabel(denied, t, undefined, 'Scout')).toBe(
            'verification.untrustedIssuer'
        );
        expect(getIssuerContextLabel(institutional, t, undefined, 'Scout')).toBe('Scout');
        expect(getIssuerContextLabel(connected, t, undefined, 'Scout')).toBe(
            'From your connection: Charles Henway'
        );
    });
});
