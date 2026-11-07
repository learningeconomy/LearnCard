import { describe, expect, test } from 'bun:test';
import { TRPCClientError } from '@trpc/client';

import { keyControlsDocument, runDiagnosis, type DiagnosableLearnCard } from './diagnose-learncard';

// Fakes only: nothing here reaches LearnCard, Fly or any real endpoint.
const DID_WEB = 'did:web:synthetic.invalid:users:service';
const KEY_DID = 'did:key:z6MkSyntheticServiceKey';
const LEARNER = 'did:web:synthetic.invalid:users:private-learner';
const SECRETS = [DID_WEB, KEY_DID, LEARNER, 'synthetic-private-payload'];

const unauthorized = () =>
    TRPCClientError.from({
        error: {
            message: 'synthetic-private-payload',
            code: -32001,
            data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'synthetic' },
        },
    });

const fakeLearnCard = (
    overrides: Partial<DiagnosableLearnCard['invoke']> = {},
    controller = KEY_DID
): DiagnosableLearnCard => ({
    id: {
        did: (method?: string) => (method === 'key' ? KEY_DID : DID_WEB),
        keypair: () => ({ x: 'synthetic-x' }),
    },
    invoke: {
        getProfile: async () => ({ profileId: 'service' }),
        getConsentFlowDataForDid: async () => ({ records: [], hasMore: false }),
        resolveDid: async () => ({ id: DID_WEB, controller }),
        ...overrides,
    },
});

const diagnose = async (learnCard: () => Promise<DiagnosableLearnCard>, stepTimeoutMs = 1_000) => {
    const lines: unknown[] = [];
    const result = await runDiagnosis({
        init: learnCard,
        learnerDid: LEARNER,
        contractId: 'synthetic-contract',
        didWeb: DID_WEB,
        stepTimeoutMs,
        write: line => lines.push(line),
    });
    const output = lines.map(line => JSON.stringify(line)).join('\n');
    for (const secret of SECRETS) expect(output).not.toContain(secret);
    return { lines, result };
};

describe('diagnose-learncard', () => {
    test('prints one line per step and the identity booleans', async () => {
        const { lines, result } = await diagnose(async () => fakeLearnCard());
        expect(lines).toEqual([
            expect.objectContaining({ step: 'init', ok: true, name: null }),
            expect.objectContaining({ step: 'getProfile', ok: true }),
            expect.objectContaining({ step: 'getConsentFlowDataForDid', ok: true }),
            expect.objectContaining({ step: 'resolveDidWeb', ok: true }),
            { didMatches: true, keyControlsDidWeb: true },
        ]);
        expect(result.keyControlsDidWeb).toBe(true);
    });

    test('reports a rejected identity by code and status, and still runs later steps', async () => {
        const { lines } = await diagnose(async () =>
            fakeLearnCard(
                {
                    getProfile: async () => {
                        throw unauthorized();
                    },
                    getConsentFlowDataForDid: async () => {
                        throw unauthorized();
                    },
                },
                'did:key:z6MkSomeoneElse'
            )
        );
        for (const step of ['getProfile', 'getConsentFlowDataForDid'])
            expect(lines).toContainEqual({
                step,
                ok: false,
                ms: expect.any(Number),
                name: 'TRPCClientError',
                code: 'UNAUTHORIZED',
                httpStatus: 401,
                causeErrno: null,
            });
        expect(lines.at(-1)).toEqual({
            didMatches: true,
            keyControlsDidWeb: false,
        });
    });

    test('times out a hung step instead of hanging', async () => {
        const startedAt = performance.now();
        const { lines } = await diagnose(
            async () => fakeLearnCard({ getProfile: () => new Promise<never>(() => {}) }),
            20
        );
        expect(lines).toContainEqual(
            expect.objectContaining({
                step: 'getProfile',
                ok: false,
                name: 'TimeoutError',
            })
        );
        expect(performance.now() - startedAt).toBeLessThan(1_000);
    });

    test('skips the remaining steps when init fails, keeping only the errno', async () => {
        const { lines, result } = await diagnose(async () => {
            throw Object.assign(new TypeError('synthetic-private-payload'), {
                cause: { code: 'ECONNREFUSED' },
            });
        });
        expect(lines[0]).toEqual({
            step: 'init',
            ok: false,
            ms: expect.any(Number),
            name: 'TypeError',
            code: null,
            httpStatus: null,
            causeErrno: 'ECONNREFUSED',
        });
        expect(lines.slice(1, 4)).toEqual([
            expect.objectContaining({ step: 'getProfile', skipped: true }),
            expect.objectContaining({
                step: 'getConsentFlowDataForDid',
                skipped: true,
            }),
            expect.objectContaining({ step: 'resolveDidWeb', skipped: true }),
        ]);
        expect(result).toEqual({ didMatches: null, keyControlsDidWeb: null });
    });

    test('matches the key by controller or by published Ed25519 key', () => {
        expect(keyControlsDocument({ controller: [KEY_DID] }, KEY_DID, undefined)).toBe(true);
        expect(
            keyControlsDocument(
                {
                    controller: 'did:key:other',
                    verificationMethod: [{ publicKeyJwk: { x: 'x1' } }],
                },
                KEY_DID,
                'x1'
            )
        ).toBe(true);
        expect(keyControlsDocument({ controller: 'did:key:other' }, KEY_DID, 'x1')).toBe(false);
        expect(keyControlsDocument(null, KEY_DID, 'x1')).toBe(false);
    });
});
