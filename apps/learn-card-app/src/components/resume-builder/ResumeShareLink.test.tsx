import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';
const mocks = vi.hoisted(() => ({
    recover: vi.fn(),
    publish: vi.fn(),
    legacy: vi.fn(),
    privacy: vi.fn(),
    toast: vi.fn(),
    clipboard: vi.fn(),
    qr: vi.fn(),
    current: true,
}));
vi.mock('learn-card-base', () => ({
    ToastTypeEnum: { Error: 'error' },
    useToast: () => ({ presentToast: mocks.toast }),
    useShareBoostMutation: mocks.legacy,
}));
vi.mock('learn-card-base/svgs/X', () => ({ default: () => null }));
vi.mock('@capacitor/clipboard', () => ({ Clipboard: { write: mocks.clipboard } }));
vi.mock('qrcode.react', () => ({
    QRCodeSVG: (props: { value: string }) => {
        mocks.qr(props.value);
        return <svg role="img" aria-label="Private QR code" />;
    },
}));
vi.mock('../../hooks/useIssueTcpResume', () => ({
    useIssueTcpResume: () => ({
        getResumeShareLink: (uri: string) => mocks.recover(uri),
        publishTcpResume: mocks.publish,
    }),
}));
vi.mock('../../helpers/resume-publishing/account', () => ({
    useResumeAccountRevision: () => 0,
    captureResumeAccount: () => () => mocks.current,
}));
vi.mock('../share-links/sharePrivacy', () => ({ enterSharePrivacy: mocks.privacy }));
import ResumeShareLink from './ResumeShareLink';
const resume = { name: 'Résumé' } as VC;
const privateLink = 'https://example.test/share/SAME#PRIVATE-CAPABILITY';
beforeEach(() => {
    vi.clearAllMocks();
    mocks.current = true;
    mocks.recover.mockResolvedValue(privateLink);
    mocks.clipboard.mockResolvedValue(undefined);
});
afterEach(cleanup);
describe('managed resume owner link', () => {
    it('recovers one committed link for QR and copy without creating a share', async () => {
        render(
            <ResumeShareLink
                resume={resume}
                resumeUri="encrypted:resume"
                committedLink={privateLink}
            />
        );
        await screen.findByText('Your private link is ready.');
        expect(mocks.qr).toHaveBeenCalledWith(privateLink);
        expect(document.body.textContent).not.toContain('PRIVATE-CAPABILITY');
        expect(mocks.privacy.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.recover.mock.invocationCallOrder[0]
        );
        fireEvent.click(screen.getByRole('button', { name: 'Copy Link' }));
        await waitFor(() => expect(mocks.clipboard).toHaveBeenCalledWith({ string: privateLink }));
        expect(mocks.recover).toHaveBeenCalledTimes(2);
        expect(mocks.publish).not.toHaveBeenCalled();
        expect(mocks.legacy).not.toHaveBeenCalled();
        expect(
            screen.getByText(/Previously saved copies and older links cannot be taken back/)
        ).toBeInTheDocument();
    });
    it('requires explicit republishing for legacy resumes and redacts errors', async () => {
        mocks.recover.mockRejectedValue({ code: 'legacy', message: 'SECRET PDF URI' });
        render(<ResumeShareLink resume={resume} resumeUri="legacy:resume" />);
        await screen.findByText('Publish this resume again to create a managed link.');
        expect(screen.queryByRole('img', { name: 'Private QR code' })).not.toBeInTheDocument();
        expect(document.body.textContent).not.toContain('SECRET');
        expect(mocks.legacy).not.toHaveBeenCalled();
    });
    it('checks access again on copy and drops a stopped cached capability', async () => {
        render(<ResumeShareLink resume={resume} resumeUri="encrypted:resume" />);
        await screen.findByText('Your private link is ready.');
        mocks.recover.mockRejectedValue({ code: 'inactive', message: privateLink });
        fireEvent.click(screen.getByRole('button', { name: 'Copy Link' }));
        await screen.findByText(
            'This link is unavailable. Publish the resume again after checking its settings.'
        );
        expect(mocks.clipboard).not.toHaveBeenCalled();
        expect(screen.queryByRole('img', { name: 'Private QR code' })).not.toBeInTheDocument();
        expect(document.body.textContent).not.toContain('PRIVATE-CAPABILITY');
    });
    it('ignores a recovery result after an account change', async () => {
        let resolve!: (link: string) => void;
        mocks.recover.mockReturnValue(
            new Promise<string>(done => {
                resolve = done;
            })
        );
        render(<ResumeShareLink resume={resume} resumeUri="encrypted:resume" />);
        mocks.current = false;
        await act(async () => {
            resolve(privateLink);
        });
        expect(mocks.qr).not.toHaveBeenCalled();
        expect(mocks.clipboard).not.toHaveBeenCalled();
    });
});
