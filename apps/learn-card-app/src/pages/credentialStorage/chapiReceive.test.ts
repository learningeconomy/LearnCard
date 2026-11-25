import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CredentialStoreEvent } from '@learncard/chapi-plugin';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { getReceivedCredentials, loadChapiPresentation } from './chapiReceive';
import { isExchangeRequest } from '../../helpers/chapi.helpers';

export const credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    credentialSubject: { id: 'did:example:holder' },
    proof: {
        type: 'DataIntegrityProof',
        cryptosuite: 'ecdsa-rdfc-2019',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key',
        proofValue: 'SIGNATURE_CANARY',
    },
    name: 'Demo Diploma',
};
const presentation = {
    '@context': credential['@context'],
    type: ['VerifiablePresentation'],
    verifiableCredential: [credential],
};
const event = (data = presentation, options = {}) =>
    ({ credential: { data, options } }) as unknown as CredentialStoreEvent;
afterEach(() => vi.unstubAllGlobals());

describe('CHAPI incoming credential boundaries', () => {
    it('handles absent optional fields without crashing worker routing', () => {
        expect(isExchangeRequest(event())).toBe(false);
        expect(isExchangeRequest({} as CredentialStoreEvent)).toBe(false);
    });
    it('preserves the signed objects and all credentials', () => {
        const result = getReceivedCredentials({
            ...presentation,
            verifiableCredential: [credential, { ...credential, name: 'Second' }],
        });
        expect(result).toHaveLength(2);
        expect(result[0]).toBe(credential);
    });
    it('accepts the VC Playground multi-proof offer without modifying signed data', async () => {
        // The real Veres VC-API response includes these three final ECDSA
        // suites without created. Each suite makes that timestamp optional.
        const offeredCredential = {
            ...credential,
            proof: ['ecdsa-rdfc-2019', 'ecdsa-jcs-2019', 'ecdsa-sd-2023'].map(cryptosuite => ({
                ...credential.proof,
                cryptosuite,
            })),
        };
        const offeredPresentation = {
            ...presentation,
            verifiableCredential: [offeredCredential],
        };
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ verifiablePresentation: offeredPresentation }),
            })
        );
        const resolved = await loadChapiPresentation(
            {} as BespokeLearnCard,
            event(presentation, { protocols: { vcapi: 'https://issuer.example/exchange' } })
        );
        expect(resolved).toBe(offeredPresentation);
        expect(getReceivedCredentials(resolved)[0]).toBe(offeredCredential);
        expect(offeredCredential.proof).toHaveLength(3);
        expect(offeredCredential.proof.every(proof => !('created' in proof))).toBe(true);
    });
    it('rejects empty and malformed offers before persisting them', () => {
        for (const value of [
            null,
            {},
            { verifiableCredential: [] },
            { verifiableCredential: [{ name: 'Invalid' }] },
        ]) {
            expect(() => getReceivedCredentials(value)).toThrow('chapi.receive.invalid');
        }
    });
    it('gets direct storage offers without a network exchange', async () => {
        const fetch = vi.fn();
        vi.stubGlobal('fetch', fetch);
        expect(await loadChapiPresentation({} as BespokeLearnCard, event())).toBe(presentation);
        expect(fetch).not.toHaveBeenCalled();
    });
    it('checks HTTP errors and never interprets an error body as a credential', async () => {
        const json = vi.fn();
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json }));
        await expect(
            loadChapiPresentation(
                {} as BespokeLearnCard,
                event(presentation, { protocols: { vcapi: 'https://issuer.example/exchange' } })
            )
        ).rejects.toThrow('chapi.receive.request');
        expect(json).not.toHaveBeenCalled();
    });
    it('returns the issued presentation, rather than the original exchange request', async () => {
        const request = {
            query: { type: 'DIDAuthentication' },
            challenge: 'test',
            domain: 'issuer.example',
        };
        const fetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ verifiablePresentationRequest: request }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ verifiablePresentation: presentation }),
            });
        vi.stubGlobal('fetch', fetch);
        const wallet = {
            id: { did: () => 'did:key:test' },
            invoke: {
                didToVerificationMethod: vi.fn().mockResolvedValue('did:key:test#key'),
                getDidAuthVp: vi.fn().mockResolvedValue({ proof: 'test' }),
            },
        };
        expect(
            await loadChapiPresentation(
                wallet as unknown as BespokeLearnCard,
                event(presentation, { protocols: { vcapi: 'https://issuer.example/exchange' } })
            )
        ).toBe(presentation);
        expect(fetch).toHaveBeenCalledTimes(2);
    });
    it('does not automatically disclose credentials for a QueryByExample exchange', async () => {
        const fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                verifiablePresentationRequest: { query: [{ type: 'QueryByExample' }] },
            }),
        });
        vi.stubGlobal('fetch', fetch);
        await expect(
            loadChapiPresentation(
                {} as BespokeLearnCard,
                event(presentation, { protocols: { vcapi: 'https://issuer.example/exchange' } })
            )
        ).rejects.toThrow('chapi.receive.invalid');
        expect(fetch).toHaveBeenCalledTimes(1);
    });
});

it.each(['eddsa-rdfc-2022', 'eddsa-jcs-2022', 'bbs-2023'])(
    'accepts %s proofs without created and preserves the signed object',
    cryptosuite => {
        const offered = { ...credential, proof: { ...credential.proof, cryptosuite } };
        expect(
            getReceivedCredentials({ ...presentation, verifiableCredential: [offered] })[0]
        ).toBe(offered);
    }
);

it('rejects JWT strings and mixed unsupported batches before any item can be saved', () => {
    expect(() =>
        getReceivedCredentials({ verifiableCredential: ['eyJhbGciOiJFZERTQSJ9.payload.signature'] })
    ).toThrow('chapi.receive.invalid');
    expect(() =>
        getReceivedCredentials({ verifiableCredential: [credential, 'unsupported'] })
    ).toThrow('chapi.receive.invalid');
});

it('retains OBv3 and CLR extension fields without normalizing them', () => {
    const badge = {
        ...credential,
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        credentialSubject: {
            type: ['AchievementSubject'],
            achievement: { type: ['Achievement'], name: 'Demo' },
        },
    };
    const clr = {
        ...credential,
        type: ['VerifiableCredential', 'ClrCredential'],
        credentialSubject: {
            type: ['ClrSubject'],
            verifiableCredential: [badge],
            customExtension: { labels: ['kept'] },
        },
    };
    const result = getReceivedCredentials({ verifiableCredential: [badge, clr] });
    expect(result[0]).toBe(badge);
    expect(result[1]).toBe(clr);
    expect(clr.credentialSubject.verifiableCredential[0]).toBe(badge);
});

it('prefers explicit VC-API protocol metadata when legacy interact is also present', async () => {
    const fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ verifiablePresentation: presentation }),
    });
    vi.stubGlobal('fetch', fetch);
    await loadChapiPresentation(
        {} as BespokeLearnCard,
        event(
            {
                ...presentation,
                interact: { service: [{ serviceEndpoint: 'https://legacy.example/exchange' }] },
            } as typeof presentation,
            { protocols: { vcapi: 'https://vcapi.example/exchange' } }
        )
    );
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][0]).toBe('https://vcapi.example/exchange');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({});
});

it('does not invoke fetch or allocate a timeout/listener for an already-aborted exchange', async () => {
    vi.useFakeTimers();
    try {
        const controller = new AbortController();
        controller.abort();
        const add = vi.spyOn(controller.signal, 'addEventListener');
        const fetch = vi.fn();
        vi.stubGlobal('fetch', fetch);
        await expect(
            loadChapiPresentation(
                {} as BespokeLearnCard,
                event(presentation, { protocols: { vcapi: 'https://issuer.example/exchange' } }),
                controller.signal
            )
        ).rejects.toMatchObject({ name: 'AbortError' });
        expect(fetch).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
        expect(add).not.toHaveBeenCalled();
    } finally {
        vi.useRealTimers();
    }
});

it('does not post a second exchange round after cancellation during DID-auth preparation', async () => {
    const controller = new AbortController();
    const fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
            verifiablePresentationRequest: {
                query: { type: 'DIDAuthentication' },
                domain: 'issuer.example',
                challenge: 'demo',
            },
        }),
    });
    vi.stubGlobal('fetch', fetch);
    const getDidAuthVp = vi.fn(async () => {
        controller.abort();
        return { proof: 'signed' };
    });
    const wallet = {
        id: { did: () => 'did:key:test' },
        invoke: {
            didToVerificationMethod: vi.fn().mockResolvedValue('did:key:test#key'),
            getDidAuthVp,
        },
    };
    await expect(
        loadChapiPresentation(
            wallet as unknown as BespokeLearnCard,
            event(presentation, { protocols: { vcapi: 'https://issuer.example/exchange' } }),
            controller.signal
        )
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(getDidAuthVp).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledOnce();
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({});
});
