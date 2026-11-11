import { describe, expect, it, vi } from 'vitest';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

import {
    getAcceptLifecycleRejection,
    getLifecycleRejectionFromAcceptError,
} from './consentFlowLifecycle';

const URI = 'lc:network:test:credential:abc';
const badRequest = (message: string) =>
    Object.assign(new Error(message), { data: { code: 'BAD_REQUEST', httpStatus: 400 } });
const withStatuses = (getMyCredentialLifecycleStatuses?: () => Promise<unknown>) =>
    ({ invoke: { getMyCredentialLifecycleStatuses } }) as unknown as BespokeLearnCard;

describe('getAcceptLifecycleRejection', () => {
    it('uses the structured lifecycle status from the server', async () => {
        const learnCard = withStatuses(vi.fn(async () => ({ [URI]: 'suspended' })));
        await expect(
            getAcceptLifecycleRejection(learnCard, URI, new TypeError('Failed to fetch'))
        ).resolves.toBe('suspended');
    });

    it('treats an active credential as a transient failure even if the error mentions revocation', async () => {
        const learnCard = withStatuses(vi.fn(async () => ({ [URI]: 'active' })));
        await expect(
            getAcceptLifecycleRejection(learnCard, URI, badRequest('Credential has been revoked'))
        ).resolves.toBeUndefined();
    });

    it('falls back to the accept error code and message when the lookup fails', async () => {
        const learnCard = withStatuses(
            vi.fn(async () => {
                throw new Error('offline');
            })
        );
        await expect(
            getAcceptLifecycleRejection(learnCard, URI, badRequest('Credential has been revoked'))
        ).resolves.toBe('revoked');
    });

    it('treats network errors as retryable when nothing proves a lifecycle rejection', async () => {
        await expect(
            getAcceptLifecycleRejection(withStatuses(), URI, new TypeError('Failed to fetch'))
        ).resolves.toBeUndefined();
    });
});

describe('getLifecycleRejectionFromAcceptError', () => {
    it('needs both the BAD_REQUEST code and a lifecycle message', () => {
        expect(getLifecycleRejectionFromAcceptError(badRequest('Credential is suspended'))).toBe(
            'suspended'
        );
        expect(
            getLifecycleRejectionFromAcceptError(new Error('Credential is suspended'))
        ).toBeUndefined();
        expect(
            getLifecycleRejectionFromAcceptError(badRequest('Not a credential URI'))
        ).toBeUndefined();
    });
});
