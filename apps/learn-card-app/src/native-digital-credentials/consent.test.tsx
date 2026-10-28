import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RequestConsent from '../pages/oid4vp/components/RequestConsent';
import type { AuthorizationRequest, DcqlSelectionResult } from '@learncard/openid4vc-plugin';

const { initWallet, toast } = vi.hoisted(() => ({
    initWallet: vi.fn(async () => ({
        invoke: {
            parseSdJwtVc: async () => ({
                disclosureKeys: ['course_name', 'learner_name'],
                claims: { course_name: 'Test course', learner_name: 'Not requested' },
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
});
