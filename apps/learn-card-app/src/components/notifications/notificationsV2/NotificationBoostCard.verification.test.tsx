import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import NotificationBoostCard from './NotificationBoostCard';

const mocks = vi.hoisted(() => ({ newModal: vi.fn(), accept: vi.fn() }));
vi.mock('react-router-dom', () => ({ useHistory: () => ({ replace: vi.fn() }) }));
vi.mock('learn-card-base/hooks/useOnScreen', () => ({ default: () => true }));
vi.mock('learn-card-base', () => ({
    useGetClaimCredential: () => ({ data: undefined, isLoading: false, isError: true }),
    useAcceptCredentialMutation: () => ({ mutate: mocks.accept, isLoading: false }),
    useUpdateNotification: () => ({ mutate: vi.fn() }),
    usePathQuery: () => new URLSearchParams('uri=delivery&claim=true'),
    useModal: () => ({ newModal: mocks.newModal }),
    ModalTypes: {},
    CredentialCategoryEnum: {},
    BoostCategoryOptionsEnum: {},
    getBoostMetadata: () => ({}),
    useGetCredentialWithEdits: () => ({}),
    useGetBoost: () => ({}),
    useGetVCInfo: () => ({}),
    contractCategoryNameToCategoryMetadata: () => ({}),
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: () => undefined,
    getDefaultCategoryForCredential: () => undefined,
    getImageUrlFromCredential: () => undefined,
    isEndorsementCredential: () => false,
}));
vi.mock('learn-card-base/helpers/didHelpers', () => ({ formatDid: () => '' }));
vi.mock('learn-card-base/components/CredentialBadge/CredentialBadgeNew', () => ({
    default: () => null,
}));
vi.mock('../../boost/claim-boost-card/BoostClaimCard', () => ({
    default: () => <div>Private preview</div>,
}));
vi.mock('./NotificationCardContainer', () => ({ NOTIFICATION_TYPES: {} }));
vi.mock('./NotificationSkeleton', () => ({ default: () => null }));
vi.mock('./types', () => ({
    NotificationTypeStyles: { loading: {} },
    CATEGORY_TO_NOTIFICATION_ENUM: {},
    notificationCardStyles: {},
}));
vi.mock('../../../paraglide/messages.js', () => ({
    'claim.modal.verificationFailed': () => "We couldn't verify this",
    'common.claim': () => 'Claim',
}));

describe('notification managed claim verification', () => {
    it('shows no preview or claim action and does not auto-open after verification fails', () => {
        const notification = { data: { vcUris: ['delivery'] } } as NotificationType;
        render(<NotificationBoostCard notification={notification} />);
        expect(screen.getByRole('alert').textContent).toBe("We couldn't verify this");
        expect(screen.queryByRole('button')).toBeNull();
        expect(screen.queryByText('Private preview')).toBeNull();
        expect(mocks.newModal).not.toHaveBeenCalled();
        expect(mocks.accept).not.toHaveBeenCalled();
    });
});
