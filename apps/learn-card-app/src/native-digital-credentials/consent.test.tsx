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

    it('explains included status metadata without rendering its tracking reference as a requested field', async () => {
        initWallet.mockImplementationOnce(async () => ({
            invoke: {
                parseSdJwtVc: async () => ({
                    disclosureKeys: ['course_name'],
                    claims: { course_name: 'Test course', learner_name: 'Not requested' },
                    issuer: 'did:key:test-issuer',
                    vct: 'https://example.test/course-completion',
                    rawPayload: {
                        status: {
                            status_list: {
                                uri: 'https://status.example.test/private-reference',
                                idx: 987654,
                            },
                        },
                    },
                }),
            },
        }));
        render(<RequestConsent {...nativeProps()} />);
        await screen.findByText(
            'The issuer, credential type and status information are also included.'
        );
        expect(screen.getAllByRole('checkbox')).toHaveLength(1);
        expect(screen.queryByText(/private-reference|987654/)).not.toBeInTheDocument();
    });
    it.each(['constructor', 'toString', 'hasOwnProperty', '__proto__'])(
        'approves the selected native credential for a valid query ID %s',
        async queryId => {
            const props = nativeProps();
            const match = props.dcqlSelection!.matches.course;
            props.dcqlSelection = {
                ...props.dcqlSelection!,
                matches: Object.fromEntries([[queryId, match]]),
            };
            props.disclosurePolicy = Object.fromEntries([[queryId, ['course_name']]]);
            render(<RequestConsent {...props} />);
            const share = await screen.findByRole('button', { name: 'Share details' });
            await waitFor(() => expect(share).toBeEnabled());
            expect(screen.getByText('Test course')).toBeVisible();
            fireEvent.click(share);
            const picks = vi.mocked(props.onApprove).mock.calls[0]![0];
            expect(Object.prototype.hasOwnProperty.call(picks.row, queryId)).toBe(true);
            expect(picks.row[queryId]).toBe(0);
            expect(picks.disclose[`${queryId}::encrypted-uri`]).toEqual({ course_name: true });
        }
    );

    it('keeps native identity and metadata available while preserving the bounded approval frame', async () => {
        const props = nativeProps();
        render(<RequestConsent {...props} />);
        const share = await screen.findByRole('button', { name: 'Share details' });
        await waitFor(() => expect(share).toBeEnabled());
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

    it.each(['android:apk-key-hash:test', 'https://verifier.example'])(
        'leads with authenticated identity and ignores installed-app branding for %s',
        async origin => {
            const props = nativeProps();
            props.nativeRequester = {
                name: 'Trusted Bank — Verified',
                packageName: 'com.example.verifier',
                origin,
            };
            render(<RequestConsent {...props} />);
            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Share details' })).toBeEnabled()
            );
            expect(screen.queryByText('Trusted Bank — Verified')).not.toBeInTheDocument();
            const identity = origin.startsWith('https:') ? origin : 'com.example.verifier';
            expect(screen.getAllByText(identity)[0]).toBeVisible();
        }
    );

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

describe('existing direct-post consent without the native bridge', () => {
    const legacyProps = (sdJwt = false): RequestConsentProps => ({
        request: {
            client_id: 'https://verifier.example.test',
            nonce: 'legacy-request',
            response_type: 'vp_token',
            response_mode: 'direct_post',
        } as AuthorizationRequest,
        dcqlSelection: {
            matches: {
                course: {
                    candidates: [
                        {
                            id: 'legacy-course',
                            title: 'Course Completion',
                            credential: sdJwt
                                ? {
                                      proof: {
                                          type: 'SdJwtCompactProof',
                                          jwt: 'issuer~disclosure~',
                                      },
                                  }
                                : {
                                      '@context': ['https://www.w3.org/2018/credentials/v1'],
                                      type: ['VerifiableCredential'],
                                      issuer: 'did:key:test-issuer',
                                      credentialSubject: { course_name: 'Test course' },
                                  },
                        },
                    ],
                },
            },
            canSatisfy: true,
        } as unknown as DcqlSelectionResult,
        onApprove: vi.fn(),
        onCancel: vi.fn(),
    });

    it.each(['approve', 'cancel'])(
        'retains ordinary credential %s without native props',
        async action => {
            const props = legacyProps();
            render(<RequestConsent {...props} />);
            expect(screen.getByRole('heading', { name: 'Share credentials?' })).toBeVisible();
            const share = await screen.findByRole('button', { name: 'Share' });
            await waitFor(() => expect(share).toBeEnabled());
            expect(screen.queryByRole('button', { name: 'Share details' })).not.toBeInTheDocument();
            fireEvent.click(
                action === 'approve' ? share : screen.getByRole('button', { name: 'Cancel' })
            );
            if (action === 'approve') {
                expect(props.onApprove).toHaveBeenCalledWith({ row: { course: 0 }, disclose: {} });
                expect(props.onCancel).not.toHaveBeenCalled();
            } else {
                expect(props.onCancel).toHaveBeenCalledOnce();
                expect(props.onApprove).not.toHaveBeenCalled();
            }
        }
    );

    it('retains selective disclosure choices for an existing SD-JWT direct-post request', async () => {
        const props = legacyProps(true);
        render(<RequestConsent {...props} />);
        const share = await screen.findByRole('button', { name: 'Share' });
        const learner = await screen.findByRole('checkbox', { name: /Learner name/ });
        await waitFor(() => expect(share).toBeEnabled());
        fireEvent.click(learner);
        expect(share).toBeEnabled();
        fireEvent.click(share);
        expect(props.onApprove).toHaveBeenCalledWith({
            row: { course: 0 },
            disclose: { 'course::legacy-course': { course_name: true, learner_name: false } },
        });
    });
});
