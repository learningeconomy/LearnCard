import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LEARNCARD_AI_PASSPORT_CONTRACT_URI } from 'learn-card-base/constants/aiPassport';
import { networkStore } from 'learn-card-base/stores/NetworkStore';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import {
    getConsentFlowContractRedirect,
    getConsentFlowDidAuthRedirect,
} from './issueConsentFlowDidAuth';

const ownerDid = 'did:web:example.test:ai-passport';

describe('getConsentFlowDidAuthRedirect', () => {
    beforeEach(() => {
        networkStore.set.aiServiceUrl('https://api.example.test');
    });

    it('binds the presentation to the backend challenge and domain', async () => {
        const issuePresentation = vi.fn(async () => 'signed.jwt');
        const wallet = {
            id: { did: () => 'did:key:holder' },
            invoke: { issuePresentation },
        } as unknown as BespokeLearnCard;
        const redirect = await getConsentFlowDidAuthRedirect({
            challenge: 'backend-challenge',
            contractUri: 'lc:contract:ai-passport',
            domain: 'https://api.example.test',
            ownerDid,
            returnTo: 'https://api.example.test/auth/callback?challenge=backend-challenge',
            wallet,
        });
        const url = new URL(redirect);

        expect(url.searchParams.get('vp')).toBe('signed.jwt');
        expect(url.searchParams.has('did')).toBe(false);
        expect(issuePresentation).toHaveBeenCalledWith(
            expect.objectContaining({
                contractUri: 'lc:contract:ai-passport',
                holder: 'did:key:holder',
            }),
            {
                challenge: 'backend-challenge',
                domain: 'https://api.example.test',
                proofFormat: 'jwt',
                proofPurpose: 'authentication',
            }
        );
    });

    it('keeps challenged presentations out of callback request URLs when requested', async () => {
        const wallet = {
            id: { did: () => 'did:key:holder' },
            invoke: { issuePresentation: vi.fn(async () => 'signed.jwt') },
        } as unknown as BespokeLearnCard;
        const redirect = await getConsentFlowDidAuthRedirect({
            challenge: 'backend-challenge',
            contractUri: 'lc:contract:ai-passport',
            domain: 'https://api.example.test',
            ownerDid,
            returnTo:
                'https://api.example.test/auth/callback?challenge=backend-challenge&response_mode=fragment',
            wallet,
        });
        const url = new URL(redirect);
        const fragment = new URLSearchParams(url.hash.slice(1));

        expect(url.searchParams.has('vp')).toBe(false);
        expect(fragment.get('vp')).toBe('signed.jwt');
    });

    it('rejects challenged callbacks outside the configured AI Passport origin', async () => {
        const wallet = {
            id: { did: () => 'did:key:holder' },
            invoke: { issuePresentation: vi.fn() },
        } as unknown as BespokeLearnCard;
        const input = {
            challenge: 'backend-challenge',
            contractUri: 'lc:contract:ai-passport',
            domain: 'https://api.example.test',
            ownerDid,
            wallet,
        };

        await expect(
            getConsentFlowDidAuthRedirect({
                ...input,
                returnTo: 'https://attacker.example/callback',
            })
        ).rejects.toThrow('DID Auth callback must use the configured AI Passport origin');
        await expect(
            getConsentFlowDidAuthRedirect({
                ...input,
                domain: 'https://attacker.example',
                returnTo: 'https://api.example.test/auth/callback',
            })
        ).rejects.toThrow('DID Auth callback must use the configured AI Passport origin');

        expect(wallet.invoke.issuePresentation).not.toHaveBeenCalled();
    });

    it('forces challenged callbacks ahead of contract redirects', () => {
        expect(
            getConsentFlowContractRedirect({
                challenge: 'backend-challenge',
                contractRedirectUrl: 'https://contract.example.test/unsafe',
                domain: 'https://api.example.test',
            })
        ).toBeUndefined();
        expect(
            getConsentFlowContractRedirect({
                contractRedirectUrl: 'https://contract.example.test/legacy',
            })
        ).toBe('https://contract.example.test/legacy');
    });

    it('rejects incomplete challenged callbacks before contract redirects', () => {
        expect(() =>
            getConsentFlowContractRedirect({
                challenge: 'backend-challenge',
                contractRedirectUrl: 'https://contract.example.test/unsafe',
            })
        ).toThrow('Incomplete DID Auth request');
    });

    it('rejects unchallenged AI Passport callbacks before signing', async () => {
        const wallet = {
            invoke: { newCredential: vi.fn(), issuePresentation: vi.fn() },
        } as unknown as BespokeLearnCard;
        await expect(
            getConsentFlowDidAuthRedirect({
                contractUri: 'lc:contract:ai-passport',
                ownerDid,
                returnTo: 'https://api.example.test/auth/callback',
                wallet,
            })
        ).rejects.toThrow('AI Passport requires challenge-based authentication');
        await expect(
            getConsentFlowDidAuthRedirect({
                contractUri: LEARNCARD_AI_PASSPORT_CONTRACT_URI,
                ownerDid,
                returnTo: 'https://other.example.test/callback',
                wallet,
            })
        ).rejects.toThrow('AI Passport requires challenge-based authentication');
        expect(wallet.invoke.newCredential).not.toHaveBeenCalled();
        expect(wallet.invoke.issuePresentation).not.toHaveBeenCalled();
        expect(() =>
            getConsentFlowContractRedirect({
                returnTo: 'https://api.example.test/auth/callback',
                contractRedirectUrl: 'https://other.example.test/redirect',
            })
        ).toThrow('AI Passport requires challenge-based authentication');
        expect(() =>
            getConsentFlowContractRedirect({
                contractRedirectUrl: 'https://api.example.test/auth/callback',
            })
        ).toThrow('AI Passport requires challenge-based authentication');
    });

    it('leaves inline AI Passport consent without a callback available', () => {
        expect(
            getConsentFlowContractRedirect({
                contractUri: LEARNCARD_AI_PASSPORT_CONTRACT_URI,
            })
        ).toBeUndefined();
    });

    it('preserves the legacy delegated login response when no challenge is supplied', async () => {
        const issuePresentation = vi.fn(async () => 'legacy.jwt');
        const wallet = {
            id: { did: () => 'did:key:legacy-holder' },
            invoke: {
                newCredential: vi.fn(() => ({ unsigned: true })),
                issueCredential: vi.fn(async () => ({ delegated: true })),
                newPresentation: vi.fn(async () => ({ type: ['VerifiablePresentation'] })),
                issuePresentation,
            },
        } as unknown as BespokeLearnCard;
        const redirect = await getConsentFlowDidAuthRedirect({
            contractUri: 'lc:contract:legacy',
            ownerDid,
            returnTo: 'https://legacy.example.test/callback',
            wallet,
        });
        const url = new URL(redirect);

        expect(url.searchParams.get('did')).toBe('did:key:legacy-holder');
        expect(url.searchParams.get('vp')).toBe('legacy.jwt');
        expect(wallet.invoke.newCredential).toHaveBeenCalledWith({
            type: 'delegate',
            subject: ownerDid,
            access: ['read', 'write'],
        });
        expect(issuePresentation).toHaveBeenCalledWith(
            expect.objectContaining({ contractUri: 'lc:contract:legacy' }),
            {
                proofFormat: 'jwt',
                proofPurpose: 'authentication',
            }
        );
    });

    it('refuses incomplete, empty, duplicated, or malformed DID Auth parameters', async () => {
        const wallet = {} as BespokeLearnCard;
        const input = {
            contractUri: 'lc:contract:ai-passport',
            ownerDid,
            returnTo: 'https://api.example.test/auth/callback',
            wallet,
        };

        await expect(
            getConsentFlowDidAuthRedirect({ ...input, challenge: 'challenge' })
        ).rejects.toThrow('Incomplete DID Auth request');
        await expect(
            getConsentFlowDidAuthRedirect({ ...input, domain: 'https://api.example.test' })
        ).rejects.toThrow('Incomplete DID Auth request');
        await expect(
            getConsentFlowDidAuthRedirect({ ...input, challenge: '', domain: '' })
        ).rejects.toThrow('Invalid DID Auth request');
        await expect(
            getConsentFlowDidAuthRedirect({
                ...input,
                challenge: ['challenge', 'duplicate'],
                domain: 'https://api.example.test',
            })
        ).rejects.toThrow('Invalid DID Auth request');
        await expect(
            getConsentFlowDidAuthRedirect({
                ...input,
                challenge: 'challenge',
                domain: ['https://api.example.test'],
            })
        ).rejects.toThrow('Invalid DID Auth request');
    });
    it('allows local AI Passport navigation without authentication output', async () => {
        const wallet = {
            invoke: { issuePresentation: vi.fn(), newCredential: vi.fn() },
        } as unknown as BespokeLearnCard;
        expect(
            getConsentFlowContractRedirect({
                contractUri: LEARNCARD_AI_PASSPORT_CONTRACT_URI,
                returnTo: '/ai/sessions',
                contractRedirectUrl: '/ai/sessions',
            })
        ).toBe('/ai/sessions');
        expect(
            await getConsentFlowDidAuthRedirect({
                contractUri: LEARNCARD_AI_PASSPORT_CONTRACT_URI,
                ownerDid,
                returnTo: '/ai/sessions',
                wallet,
            })
        ).toBe('/ai/sessions');
        expect(wallet.invoke.issuePresentation).not.toHaveBeenCalled();
        expect(wallet.invoke.newCredential).not.toHaveBeenCalled();
    });
    it.each([
        '//api.example.test/callback',
        '/\\api.example.test/callback',
        'https://other.example.test/callback',
    ])('blocks external AI Passport destination %s', returnTo => {
        expect(() =>
            getConsentFlowContractRedirect({
                contractUri: LEARNCARD_AI_PASSPORT_CONTRACT_URI,
                returnTo,
            })
        ).toThrow('refresh and sign in again');
    });
    it.each(['TODO_AI_SERVICE', 'not a URL'])(
        'preserves unrelated delegation with configuration %s',
        async config => {
            networkStore.set.aiServiceUrl(config);
            const wallet = {
                id: { did: () => 'did:key:holder' },
                invoke: {
                    newCredential: vi.fn(() => ({})),
                    issueCredential: vi.fn(async () => ({})),
                    newPresentation: vi.fn(async () => ({})),
                    issuePresentation: vi.fn(async () => 'delegated.jwt'),
                },
            } as unknown as BespokeLearnCard;
            const url = new URL(
                await getConsentFlowDidAuthRedirect({
                    contractUri: 'lc:contract:game',
                    ownerDid,
                    returnTo: 'https://game.example.test/callback',
                    wallet,
                })
            );
            expect(url.searchParams.get('vp')).toBe('delegated.jwt');
            expect(() =>
                getConsentFlowContractRedirect({
                    contractUri: LEARNCARD_AI_PASSPORT_CONTRACT_URI,
                    returnTo: 'https://other.example.test/callback',
                })
            ).toThrow('refresh and sign in again');
            expect(() =>
                getConsentFlowContractRedirect({
                    challenge: 'challenge',
                    domain: 'https://api.example.test',
                    returnTo: 'https://api.example.test/callback',
                })
            ).toThrow('configured AI Passport origin');
        }
    );
    it('validates a known challenged destination up front', () => {
        expect(() =>
            getConsentFlowContractRedirect({
                challenge: 'challenge',
                domain: 'https://wrong.example.test',
                returnTo: 'https://api.example.test/callback',
            })
        ).toThrow('configured AI Passport origin');
    });
    it('preserves unrelated relative contract navigation', () => {
        expect(
            getConsentFlowContractRedirect({
                contractUri: 'lc:contract:game',
                returnTo: 'game/menu',
                contractRedirectUrl: 'game/menu',
            })
        ).toBe('game/menu');
    });
    it('keeps a complete challenge pair from turning local navigation into authentication transport', async () => {
        const input = {
            challenge: 'backend-challenge',
            domain: 'https://api.example.test',
            contractUri: LEARNCARD_AI_PASSPORT_CONTRACT_URI,
            returnTo: '/ai/sessions',
        };
        expect(getConsentFlowContractRedirect(input)).toBeUndefined();
        const wallet = { invoke: { issuePresentation: vi.fn() } } as unknown as BespokeLearnCard;
        expect(await getConsentFlowDidAuthRedirect({ ...input, ownerDid, wallet })).toBe(
            '/ai/sessions'
        );
        expect(wallet.invoke.issuePresentation).not.toHaveBeenCalled();
    });
});
