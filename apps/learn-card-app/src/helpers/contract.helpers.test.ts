import { describe, expect, it, vi } from 'vitest';
import type { ConsentFlowContract } from '@learncard/types';

vi.mock('learn-card-base', () => ({
    BoostCategoryOptionsEnum: {},
    CredentialCategoryEnum: {},
    boostCategoryMetadata: new Proxy({}, { get: () => ({}) }),
    categoryMetadata: new Proxy({}, { get: () => ({}) }),
    contractCategoryNameToCategoryMetadata: () => undefined,
    getBaseUrl: () => '',
}));
vi.mock('../pages/wallet/constants', () => ({ walletPageData: [] }));
vi.mock('../components/ai-passport-apps/aiPassport-apps.helpers', () => ({
    getAiAppBackgroundStylesForApp: () => ({}),
}));

import { getFullTermsForContract, getMinimumTermsForContract } from './contract.helpers';

const contract = {
    read: { credentials: { categories: {} }, personal: {} },
    write: {
        credentials: {
            categories: {
                Achievement: { required: false, defaultEnabled: true },
                'AI Insight': { required: true },
                ID: { required: false, defaultEnabled: false, canWrite: false },
            },
        },
        personal: {},
    },
} as ConsentFlowContract;

describe('initial write terms (LC-2423)', () => {
    it('starts every write category as Suggest only', () => {
        const minimum = getMinimumTermsForContract(contract);
        expect(minimum.write.credentials.categories).toEqual({
            Achievement: true,
            'AI Insight': true,
            ID: false,
        });
        expect(minimum.write.credentials.canWrite).toEqual({
            Achievement: false,
            'AI Insight': false,
            ID: false,
        });
        expect(getFullTermsForContract(contract).write.credentials.canWrite).toEqual({
            Achievement: false,
            'AI Insight': false,
            ID: false,
        });
    });

    it('leaves canWrite to the contract for first-party background consent', () => {
        expect(
            getMinimumTermsForContract(contract, null, { writeMode: 'direct' }).write.credentials
                .canWrite
        ).toBeUndefined();
        expect(
            getFullTermsForContract(contract, null, { writeMode: 'direct' }).write.credentials
                .canWrite
        ).toBeUndefined();
    });
});
