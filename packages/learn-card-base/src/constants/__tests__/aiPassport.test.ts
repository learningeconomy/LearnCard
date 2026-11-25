import { describe, expect, it, vi } from 'vitest';

const networkUrl = vi.hoisted(() => ({ current: 'https://network.learncard.com/trpc' }));

vi.mock('learn-card-base/stores/NetworkStore', () => ({
    networkStore: { get: { networkUrl: () => networkUrl.current } },
}));

import {
    LEARNCARD_AI_PASSPORT_CONTRACT_URI,
    LEARNCARD_AI_PASSPORT_STAGING_CONTRACT_URI,
    getLearnCardAiPassportContractUri,
    hasLearnCardAiPassportContract,
    isLearnCardAiPassportContractUri,
} from '../aiPassport';

const PROD = 'https://network.learncard.com/trpc';
const STAGING = 'https://staging.network.learncard.com/trpc';
const LOCAL = 'http://localhost:4000/trpc';

describe('getLearnCardAiPassportContractUri', () => {
    it('keeps the production contract on the production network', () => {
        expect(LEARNCARD_AI_PASSPORT_CONTRACT_URI).toBe(
            'lc:network:network.learncard.com/trpc:contract:fd6649c7-52c9-4d02-b5ab-fade649d5a0b'
        );
        expect(getLearnCardAiPassportContractUri(PROD)).toBe(LEARNCARD_AI_PASSPORT_CONTRACT_URI);
    });

    it('resolves the staging contract on the staging network', () => {
        expect(getLearnCardAiPassportContractUri(STAGING)).toBe(
            'lc:network:staging.network.learncard.com/trpc:contract:9eade6a7-7181-4509-b805-d26e30a8f7f1'
        );
        expect(getLearnCardAiPassportContractUri(`${STAGING}/`)).toBe(
            LEARNCARD_AI_PASSPORT_STAGING_CONTRACT_URI
        );
    });

    it('falls back to the production contract on other networks', () => {
        expect(getLearnCardAiPassportContractUri(LOCAL)).toBe(LEARNCARD_AI_PASSPORT_CONTRACT_URI);
    });

    it('reads the network store when no URL is passed', () => {
        networkUrl.current = STAGING;
        expect(getLearnCardAiPassportContractUri()).toBe(
            LEARNCARD_AI_PASSPORT_STAGING_CONTRACT_URI
        );
        networkUrl.current = PROD;
        expect(getLearnCardAiPassportContractUri()).toBe(LEARNCARD_AI_PASSPORT_CONTRACT_URI);
    });
});

describe('hasLearnCardAiPassportContract', () => {
    it('is true on production and staging only', () => {
        expect(hasLearnCardAiPassportContract(PROD)).toBe(true);
        expect(hasLearnCardAiPassportContract(STAGING)).toBe(true);
        expect(hasLearnCardAiPassportContract(LOCAL)).toBe(false);
    });
});

describe('isLearnCardAiPassportContractUri', () => {
    it('matches both the production and staging contracts', () => {
        expect(isLearnCardAiPassportContractUri(LEARNCARD_AI_PASSPORT_CONTRACT_URI)).toBe(true);
        expect(isLearnCardAiPassportContractUri(LEARNCARD_AI_PASSPORT_STAGING_CONTRACT_URI)).toBe(
            true
        );
        expect(isLearnCardAiPassportContractUri('lc:contract:other')).toBe(false);
        expect(isLearnCardAiPassportContractUri(undefined)).toBe(false);
    });
});
