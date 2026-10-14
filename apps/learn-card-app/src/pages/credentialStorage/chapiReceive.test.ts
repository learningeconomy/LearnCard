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
