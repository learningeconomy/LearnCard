import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RequestConsent, {
    type RequestConsentProps,
} from '../pages/oid4vp/components/RequestConsent';
import type { AuthorizationRequest, DcqlSelectionResult } from '@learncard/openid4vc-plugin';

const { initWallet, toast } = vi.hoisted(() => ({
    initWallet: vi.fn(async () => ({
        invoke: {
            parseSdJwtVc: async () => ({
                disclosureKeys: ['course_name', 'learner_name'],
                claims: { course_name: 'Test course', learner_name: 'Not requested' },
                issuer: 'did:key:test-issuer',
                vct: 'https://example.test/course-completion',
            }),
        },
    })),
    toast: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet }),
    useToast: () => ({ presentToast: toast }),
    BoostPageViewMode: { Card: 'card' },
    ToastTypeEnum: { Error: 'error' },
    VerifierHeader: () => <div>Verified requester</div>,
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Achievement',
    humanizeCredentialType: (value: string) => value,
}));
vi.mock('../components/boost/boost-earned-card/BoostEarnedCard', () => ({
    BoostEarnedCard: () => <div>Course credential</div>,
}));

describe('shared consent on the native transport', () => {
    it('shows only requested fields and disables approval when a required field is unchecked', async () => {
        const approve = vi.fn();
        const candidate = {
            id: 'encrypted-uri',
            credential: { proof: { type: 'SdJwtCompactProof', jwt: 'issuer~disclosure~' } },
        };
        render(
            <RequestConsent
                request={
                    {
                        client_id: 'android:apk-key-hash:test',
                        nonce: 'n',
                        response_type: 'vp_token',
                        response_mode: 'dc_api',
                    } as AuthorizationRequest
                }
                dcqlSelection={
                    {
                        matches: { course: { candidates: [candidate] } },
                        canSatisfy: true,
                    } as unknown as DcqlSelectionResult
                }
                disclosurePolicy={{ course: ['course_name'] }}
                onApprove={approve}
                onCancel={vi.fn()}
            />
        );
        const share = await screen.findByRole('button', { name: 'Share' });
        await waitFor(() => expect(share).toBeEnabled());
        expect(screen.queryByText('Not requested')).not.toBeInTheDocument();
        const check = screen.getByRole('checkbox');
        fireEvent.click(check);
        expect(share).toBeDisabled();
        fireEvent.click(check);
        fireEvent.click(share);
        expect(approve).toHaveBeenCalledWith({
            row: { course: 0 },
            disclose: { 'course::encrypted-uri': { course_name: true } },
        });
    });

    const nativeProps = (): RequestConsentProps => ({
        request: {
            client_id: 'android:apk-key-hash:test',
            nonce: 'n',
            response_type: 'vp_token',
            response_mode: 'dc_api',
            client_metadata: { client_name: 'Untrusted request branding' },
        } as AuthorizationRequest,
        dcqlSelection: {
            matches: {
                course: {
                    candidates: [
                        {
                            id: 'encrypted-uri',
                            title: 'Course Completion',
                            credential: {
                                proof: { type: 'SdJwtCompactProof', jwt: 'issuer~disclosure~' },
                            },
                        },
                    ],
                },
            },
            canSatisfy: true,
        } as unknown as DcqlSelectionResult,
        nativeRequester: {
            name: 'com.example.verifier',
            packageName: 'com.example.verifier',
            origin: 'android:apk-key-hash:test',
        },
        disclosurePolicy: { course: ['course_name'] },
        onApprove: vi.fn(),
        onCancel: vi.fn(),
    });

    it('keeps native identity and metadata available while preserving the bounded approval frame', async () => {
        const props = nativeProps();
        render(<RequestConsent {...props} />);
        const share = await screen.findByRole('button', { name: 'Share details' });
        await waitFor(() => expect(share).toBeEnabled());
        expect(screen.getByText('Android app')).toBeVisible();
        expect(screen.getByText('com.example.verifier')).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Course Completion' })).toBeVisible();
        expect(screen.queryByText('Untrusted request branding')).not.toBeInTheDocument();
        expect(screen.queryByText('Not requested')).not.toBeInTheDocument();
        expect(screen.getByText('android:apk-key-hash:test')).not.toBeVisible();
        fireEvent.click(screen.getByText('Request details'));
        expect(screen.getByText('android:apk-key-hash:test')).toBeVisible();
        fireEvent.click(screen.getByText('Credential details'));
        expect(screen.getByText('did:key:test-issuer')).toBeVisible();

        fireEvent.click(screen.getByRole('checkbox'));
        expect(share).toBeDisabled();
        expect(
            screen.getByText('These fields are required. You can cancel instead.')
        ).toBeVisible();
        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.click(share);
        expect(props.onApprove).toHaveBeenCalledWith({
            row: { course: 0 },
            disclose: { 'course::encrypted-uri': { course_name: true } },
        });
    });

    it('prevents changing or canceling a native approval in flight and supports cancellation before approval', async () => {
        const props = nativeProps();
        const { rerender } = render(<RequestConsent {...props} />);
        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Share details' })).toBeEnabled()
        );
        rerender(<RequestConsent {...props} submitting />);
        expect(screen.getByRole('button', { name: 'Sharing…' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
        expect(screen.getByRole('checkbox')).toBeDisabled();
        rerender(<RequestConsent {...props} />);
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(props.onCancel).toHaveBeenCalledOnce();
        expect(props.onApprove).not.toHaveBeenCalled();
    });
});
