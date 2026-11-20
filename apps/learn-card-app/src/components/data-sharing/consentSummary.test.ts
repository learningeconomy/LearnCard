import { describe, expect, it } from 'vitest';
import { PaginatedConsentFlowTermsValidator } from '@learncard/types';
import {
    buildPermissionText,
    summarizeConsent,
    summarizeContractPermissions,
    type ConsentedContract,
} from './consentSummary';

const outcomeOnly = (): ConsentedContract =>
    PaginatedConsentFlowTermsValidator.shape.records.element.parse({
        uri: 'terms-referral',
        status: 'live',
        consentedVersion: 1,
        consenter: { profileId: 'learner', did: 'did:key:learner' },
        terms: {
            outcomes: ['encrypted-outcome-a', 'encrypted-outcome-b'],
            read: {
                personal: {},
                credentials: {
                    sharing: false,
                    shareAll: false,
                    categories: { Achievement: { sharing: false, shareAll: false, shared: [] } },
                },
            },
            write: { personal: {}, credentials: { categories: {} } },
        },
        contract: {
            uri: 'contract-referral',
            name: 'Career referral',
            contract: {},
            owner: { profileId: 'provider', did: 'did:key:provider' },
            version: 1,
            createdAt: '2026-11-01T00:00:00.000Z',
            updatedAt: '2026-11-01T00:00:00.000Z',
        },
    });

describe('outcome privacy summaries', () => {
    it('shows individually shared outcomes without claiming category or write grants', () => {
        const record = outcomeOnly();
        expect(buildPermissionText(record)).toBe('Selected outcomes: 2');
        expect(summarizeContractPermissions(record)).toEqual({ read: 0, write: 0 });
        const summary = summarizeConsent([record]);
        expect(summary.canRead).toBe(1);
        expect(summary.canWrite).toBe(0);
    });

    it('stops counting read access once the last outcome is removed', () => {
        const record = outcomeOnly();
        record.terms.outcomes = [];
        expect(summarizeConsent([record]).canRead).toBe(0);
        expect(buildPermissionText(record)).not.toContain('Selected outcomes');
    });
});
