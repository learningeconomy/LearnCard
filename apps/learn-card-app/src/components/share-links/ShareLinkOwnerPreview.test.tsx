import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { ShareLink, SharePayload } from '@learncard/types';

import ShareLinkOwnerPreview from './ShareLinkOwnerPreview';

const mocks = vi.hoisted(() => ({
    initWallet: vi.fn(),
    getContent: vi.fn(),
    readRecovery: vi.fn(),
    decrypt: vi.fn(),
    validate: vi.fn(),
}));

vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: mocks.initWallet }),
}));
vi.mock('learn-card-base/helpers/share-links', () => ({
    decryptSharePayload: (...args: unknown[]) => mocks.decrypt(...args),
    validateShareManifest: (...args: unknown[]) => mocks.validate(...args),
}));
vi.mock('./shareLinkFlow', () => ({
    shareWallet: (wallet: unknown) => wallet,
    readShareRecovery: (...args: unknown[]) => mocks.readRecovery(...args),
}));
vi.mock('./ShareLinkPreview', () => ({
    ShareLinkPreview: ({ title, note }: { title: string; note?: string }) => (
        <div data-testid="owner-preview">
            {title} · {note}
        </div>
    ),
}));

const share = {
    id: 'AAAAAAAAAAAAAAAAAAAAAA',
    title: 'Career highlights',
    note: 'For the fall internship application.',
    selectedCount: 1,
    version: 1,
    contentVersion: 1,
    status: 'active',
    contentState: 'finalized',
    createdAt: '2026-09-20T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
    expiresAt: null,
    stoppedAt: null,
    lastViewedAt: null,
    passcodeProtected: true,
    notifyOnView: false,
    minorPolicy: {
        isMinor: false,
        policyResolved: true,
        defaultExpiryDays: 365,
        viewCountingEnabled: true,
    },
} as ShareLink;

const payload = {
    selection: [{ credentialIndex: 0 }],
    presentation: { verifiableCredential: [{}] },
    endorsements: [],
    sharer: { displayName: 'Owner One' },
} as unknown as SharePayload;

beforeEach(() => {
    const wallet = { invoke: { getShareLinkOwnerContent: mocks.getContent } };
    mocks.initWallet.mockResolvedValue(wallet);
    mocks.getContent.mockResolvedValue({
        id: share.id,
        contentVersion: share.contentVersion,
        envelope: { v: 1, alg: 'A256GCM', iv: 'iv', ct: 'ciphertext' },
    });
    mocks.readRecovery.mockResolvedValue({
        latest: { contentVersion: share.contentVersion, key: 'content-key' },
    });
    mocks.decrypt.mockResolvedValue(payload);
    mocks.validate.mockReturnValue({ ok: true, manifest: payload });
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('ShareLinkOwnerPreview', () => {
    it('decrypts and validates the exact owner content before rendering the shared preview', async () => {
        render(<ShareLinkOwnerPreview share={share} onDismiss={() => undefined} />);

        expect(await screen.findByTestId('owner-preview')).toHaveTextContent(
            'Career highlights · For the fall internship application.'
        );
        expect(mocks.getContent).toHaveBeenCalledWith(share.id);
        expect(mocks.decrypt).toHaveBeenCalledWith(
            expect.objectContaining({
                shareId: share.id,
                contentVersion: share.contentVersion,
                key: 'content-key',
            })
        );
        expect(mocks.validate).toHaveBeenCalledWith(payload, {
            shareId: share.id,
            contentVersion: share.contentVersion,
        });
    });
});
