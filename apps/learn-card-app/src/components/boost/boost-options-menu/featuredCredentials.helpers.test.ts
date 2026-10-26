import { describe, expect, it, vi } from 'vitest';

import type { VC } from '@learncard/types';
import type { LCR } from 'learn-card-base/types/credential-records';

// The real helper module pulls the web3auth stack, which cannot load under jsdom.
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: (vc?: VC) =>
        vc?.type?.includes('CertifiedBoostCredential') && vc?.boostCredential
            ? vc.boostCredential
            : vc,
}));

import {
    MAX_FEATURED_CREDENTIALS,
    addFeaturedCredential,
    getFeaturableCredentialUri,
    hasFeaturedCapacity,
    isCredentialFeatured,
    removeFeaturedCredential,
} from './featuredCredentials.helpers';

const baseCredential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:credential:achievement',
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2026-08-06T00:00:00.000Z',
    credentialSubject: { id: 'did:example:learner' },
} as unknown as VC;

const fiveUris = ['lc:boost:1', 'lc:boost:2', 'lc:boost:3', 'lc:boost:4', 'lc:boost:5'];

describe('getFeaturableCredentialUri', () => {
    it('uses the boost URI carried on the credential', () => {
        const credential = { ...baseCredential, boostId: 'lc:boost:outer' } as VC;

        expect(getFeaturableCredentialUri(credential)).toBe('lc:boost:outer');
    });

    it('falls back to the wrapped boost credential URI', () => {
        const credential = {
            ...baseCredential,
            type: ['VerifiableCredential', 'CertifiedBoostCredential'],
            boostCredential: { ...baseCredential, boostId: 'lc:boost:inner' },
        } as unknown as VC;

        expect(getFeaturableCredentialUri(credential)).toBe('lc:boost:inner');
    });

    it('falls back to the index record boost URI', () => {
        const record = { uri: 'lc:cloud:encrypted', boostUri: 'lc:boost:record' } as Partial<LCR>;

        expect(getFeaturableCredentialUri(baseCredential, record)).toBe('lc:boost:record');
    });

    it('never falls back to the encrypted storage locator', () => {
        const record = { uri: 'lc:cloud:encrypted' } as Partial<LCR>;

        expect(getFeaturableCredentialUri(baseCredential, record)).toBeUndefined();
        expect(
            getFeaturableCredentialUri({ ...baseCredential, boostId: '' } as VC)
        ).toBeUndefined();
        expect(getFeaturableCredentialUri(undefined, undefined)).toBeUndefined();
    });
});

describe('featured credential selection helpers', () => {
    it('reports whether a URI is featured and whether there is room for more', () => {
        expect(isCredentialFeatured(['lc:boost:1'], 'lc:boost:1')).toBe(true);
        expect(isCredentialFeatured(['lc:boost:1'], 'lc:boost:2')).toBe(false);
        expect(hasFeaturedCapacity([])).toBe(true);
        expect(hasFeaturedCapacity(fiveUris.slice(0, MAX_FEATURED_CREDENTIALS - 1))).toBe(true);
        expect(hasFeaturedCapacity(fiveUris)).toBe(false);
    });

    it('appends a new URI after the existing ordered selection', () => {
        const current = ['lc:boost:3', 'lc:boost:1'];

        expect(addFeaturedCredential(current, 'lc:boost:2')).toEqual([
            'lc:boost:3',
            'lc:boost:1',
            'lc:boost:2',
        ]);
        expect(current).toEqual(['lc:boost:3', 'lc:boost:1']);
    });

    it('keeps an already featured URI in its current position', () => {
        expect(addFeaturedCredential(['lc:boost:3', 'lc:boost:1'], 'lc:boost:3')).toEqual([
            'lc:boost:3',
            'lc:boost:1',
        ]);
    });

    it('refuses a sixth URI instead of trimming the selection', () => {
        expect(MAX_FEATURED_CREDENTIALS).toBe(5);
        expect(addFeaturedCredential(fiveUris, 'lc:boost:6')).toBeUndefined();
        expect(addFeaturedCredential(fiveUris, 'lc:boost:2')).toEqual(fiveUris);
    });

    it('removes a URI without reordering the rest', () => {
        expect(removeFeaturedCredential(fiveUris, 'lc:boost:3')).toEqual([
            'lc:boost:1',
            'lc:boost:2',
            'lc:boost:4',
            'lc:boost:5',
        ]);
        expect(removeFeaturedCredential(fiveUris, 'lc:boost:missing')).toEqual(fiveUris);
    });
});
