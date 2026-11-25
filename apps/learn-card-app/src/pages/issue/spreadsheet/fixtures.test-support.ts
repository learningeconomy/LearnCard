import type { InboxBatchStatus } from '@learncard/types';
import type { IssuanceRun } from './issuanceTypes';
import {
    staticField,
    systemField,
    DEFAULT_CONTEXTS,
    DEFAULT_TYPES,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

export const makeRun = (count = 1): IssuanceRun => {
    const id = crypto.randomUUID();
    return {
        version: 1,
        id,
        scope: {
            issuer: 'did:web:issuer.test',
            domain: 'https://network.test',
            tenant: 'learncard',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        template: {
            contexts: DEFAULT_CONTEXTS,
            types: DEFAULT_TYPES,
            name: staticField('Badge'),
            issuer: { id: systemField('issuer_did'), name: staticField('Issuer') },
            credentialSubject: {
                id: systemField('recipient_did'),
                achievement: {
                    name: staticField('Badge'),
                    description: staticField('Description'),
                    criteria: { narrative: staticField('Criteria') },
                },
            },
            validFrom: systemField('issue_date'),
            customFields: [],
        },
        draft: {
            id,
            recipients: Array.from({ length: count }, (_, index) => ({
                kind: 'email',
                rowId: `row-${index}`,
                email: `person${index}@test.com`,
            })),
            values: {},
            evidence: {},
        },
        scopes: {},
        shared: {},
        outcomes: {},
        attempts: [],
    };
};

export const statusFor = (
    batchId: string,
    count: number,
    failed: number[] = []
): InboxBatchStatus => ({
    batchId,
    createdAt: new Date().toISOString(),
    status: 'COMPLETED',
    done: true,
    items: Array.from({ length: count }, (_, index) => ({
        index,
        state: 'COMPLETED',
        result: failed.includes(index)
            ? { success: false, index, error: { code: 'BAD_REQUEST', message: 'invalid row' } }
            : {
                  success: true,
                  index,
                  issuanceId: `issuance-${index}`,
                  status: 'PENDING',
                  recipient: { type: 'email', value: `person${index}@test.com` },
              },
    })),
    summary: {
        total: count,
        succeeded: count - failed.length,
        failed: failed.length,
        deduplicated: 0,
        completed: count,
        pending: 0,
        unconfirmed: 0,
    },
});
