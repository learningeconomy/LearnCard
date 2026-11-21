// @vitest-environment jsdom
import React, { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConsentFlowContractDetails } from '@learncard/types';
import { TenantConfigProvider } from '../../config/TenantConfigProvider';
import type { TenantConfig } from '../../config/tenantConfig';
import type { FieldReview } from '../ConsentProfileFields';

const modal = vi.hoisted(() => ({ newModal: vi.fn(), closeModal: vi.fn() }));
vi.mock('../../components/modals/useModal', () => ({ useModal: () => modal }));
vi.mock('../../i18n', () => ({ useT: () => (key: string) => key }));
vi.mock('../ConsentProfileFields', () => ({
    ConsentProfileFields: () => <form aria-label="Requested fields" />,
}));
import { useConsentAudienceReview } from '../useConsentAudienceReview';

const notice = 'Your answers will be analyzed in aggregate.';
const config = { verifiableDataConsentNotice: notice } as unknown as TenantConfig;

const contract = {
    owner: { profileId: 'owner', displayName: 'Origin Organization', did: 'did:key:owner' },
    recipients: [
        { profileId: 'partner', displayName: 'Partner Organization', did: 'did:key:partner' },
    ],
    audienceVersion: 1,
} as ConsentFlowContractDetails;

describe('fresh consent audience review', () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(cleanup);
    const startReview = (fieldReview?: FieldReview) => {
        const hook = renderHook(() => useConsentAudienceReview());
        const pending = hook.result.current(contract, fieldReview);
        const element = modal.newModal.mock.calls[0]![0];
        const review = render(
            <StrictMode>
                <TenantConfigProvider config={config}>{element}</TenantConfigProvider>
            </StrictMode>
        );
        return { pending, review, hook };
    };

    it('shows the owner and every recipient and waits for explicit confirmation', async () => {
        const { pending } = startReview();
        let finished = false;
        void pending.then(() => {
            finished = true;
        });
        expect(screen.getByText('Origin Organization')).toBeTruthy();
        expect(screen.getByText('Partner Organization')).toBeTruthy();
        expect(screen.getByText('@partner')).toBeTruthy();
        expect(screen.queryByText(notice)).toBeNull();
        await act(async () => {
            await Promise.resolve();
        });
        expect(finished).toBe(false);
        fireEvent.click(screen.getByText('consentAudience.confirm'));
        await expect(pending).resolves.toBeUndefined();
        expect(modal.closeModal).toHaveBeenCalledOnce();
    });

    it('shows the tenant notice once above the requested fields', async () => {
        const { pending } = startReview({} as FieldReview);
        const noticeElement = screen.getByText(notice);
        const form = screen.getByRole('form', { name: 'Requested fields' });
        expect(noticeElement.nextElementSibling).toBe(form);
        modal.newModal.mock.calls[0]![1].onClose();
        await expect(pending).rejects.toThrow('Sharing canceled');
    });

    it('cancellation rejects the sharing operation', async () => {
        const { pending } = startReview();
        const result = expect(pending).rejects.toThrow('Sharing canceled');
        fireEvent.click(screen.getByText('consentAudience.cancel'));
        await result;
    });

    it('dismissing all modals settles the pending review', async () => {
        const { pending, review } = startReview();
        const result = expect(pending).rejects.toThrow('Sharing canceled');
        review.unmount();
        await result;
    });

    it('unmounting the consent caller cancels the operation', async () => {
        const { pending, hook } = startReview();
        const result = expect(pending).rejects.toThrow('Sharing canceled');
        hook.unmount();
        await result;
    });

    it('keeps legacy owner-only consent compatible but reviews previously changed audiences', async () => {
        const hook = renderHook(() => useConsentAudienceReview());
        await hook.result.current({ ...contract, recipients: [], audienceVersion: 0 });
        expect(modal.newModal).not.toHaveBeenCalled();
        const pending = hook.result.current({ ...contract, recipients: [], audienceVersion: 2 });
        expect(modal.newModal).toHaveBeenCalledOnce();
        modal.newModal.mock.calls[0]![1].onClose();
        await expect(pending).rejects.toThrow('Sharing canceled');
    });
});
