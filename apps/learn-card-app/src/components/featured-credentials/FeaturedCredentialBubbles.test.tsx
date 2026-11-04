import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { VC } from '@learncard/types';

type ResolveResult = { uri: string; data?: VC; isPending: boolean; isError: boolean };
type PreviewProps = {
    credential: VC;
    categoryType: string;
    owner?: { profileId: string };
    onClose: () => void;
};
type ModalOptions = { onClose?: () => void };
type ModalType = { desktop: string; mobile: string };

const mocks = vi.hoisted(() => ({
    newModal: vi.fn(),
    closeModal: vi.fn(),
    preview: vi.fn(),
    useResolveBoosts: vi.fn<(uris: string[]) => ResolveResult[]>(() => []),
}));

vi.mock('learn-card-base', () => ({
    useModal: () => ({ newModal: mocks.newModal, closeModal: mocks.closeModal }),
    ModalTypes: { FullScreen: 'full-screen' },
    useResolveBoosts: mocks.useResolveBoosts,
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: (credential: VC) => credential,
    getDefaultCategoryForCredential: (credential: VC & { category?: string }) =>
        credential.category,
    getCredentialName: (credential: VC) => credential.name ?? '',
    getImageUrlFromCredential: (credential: VC) => credential.image,
}));
vi.mock('./FeaturedCredentialPreview', () => ({
    default: (props: PreviewProps) => {
        mocks.preview(props);
        return null;
    },
}));

import { FeaturedCredentialBubbles } from './FeaturedCredentialBubbles';

const credential = (name: string, image?: string): VC =>
    ({ name, image, category: 'Social Badge' }) as unknown as VC;

const resolved = (uri: string, data: VC): ResolveResult => ({
    uri,
    data,
    isPending: false,
    isError: false,
});
const failed = (uri: string): ResolveResult => ({ uri, isPending: false, isError: true });

const owner = { profileId: 'ada', displayName: 'Ada Learner', image: '' };

const lastModal = () => {
    const [element, options, modalType] = mocks.newModal.mock.calls.at(-1) as [
        React.ReactElement<PreviewProps>,
        ModalOptions,
        ModalType,
    ];
    return { element, options, modalType };
};

beforeEach(() => {
    mocks.newModal.mockReset();
    mocks.closeModal.mockReset();
    mocks.preview.mockReset();
    mocks.useResolveBoosts.mockReset();
    mocks.useResolveBoosts.mockReturnValue([]);
});
afterEach(cleanup);

describe('FeaturedCredentialBubbles', () => {
    it('renders nothing when the profile features no credentials', () => {
        const { container } = render(<FeaturedCredentialBubbles uris={undefined} owner={owner} />);

        expect(container.firstChild).toBeNull();
    });

    it('renders nothing while no selected credential can be shown', () => {
        mocks.useResolveBoosts.mockReturnValue([failed('lc:boost:gone')]);

        const { container } = render(
            <FeaturedCredentialBubbles uris={['lc:boost:gone']} owner={owner} />
        );

        expect(container.firstChild).toBeNull();
    });

    it('shows one labelled bubble per resolved credential in the stored order', () => {
        mocks.useResolveBoosts.mockReturnValue([
            resolved('lc:boost:b', credential('Team Player', 'https://example.test/team.png')),
            failed('lc:boost:gone'),
            resolved('lc:boost:a', credential('Mentor')),
        ]);

        render(
            <FeaturedCredentialBubbles
                uris={['lc:boost:b', 'lc:boost:gone', 'lc:boost:a']}
                owner={owner}
            />
        );

        expect(screen.getByRole('list', { name: 'Featured credentials' })).toBeTruthy();
        expect(
            screen.getAllByRole('button').map(button => button.getAttribute('aria-label'))
        ).toEqual(['View featured credential: Team Player', 'View featured credential: Mentor']);
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(document.querySelector('img')).toHaveAttribute(
            'src',
            'https://example.test/team.png'
        );
    });

    it('falls back to a category icon when the credential image fails to load', () => {
        mocks.useResolveBoosts.mockReturnValue([
            resolved('lc:boost:b', credential('Team Player', 'https://example.test/broken.png')),
        ]);

        render(<FeaturedCredentialBubbles uris={['lc:boost:b']} owner={owner} />);

        fireEvent.error(document.querySelector('img')!);

        expect(document.querySelector('img')).toBeNull();
        expect(document.querySelector('button svg')).toBeTruthy();
    });

    it('opens the read-only detail view for the tapped credential', () => {
        const mentor = credential('Mentor');
        mocks.useResolveBoosts.mockReturnValue([
            resolved('lc:boost:b', credential('Team Player')),
            resolved('lc:boost:a', mentor),
        ]);

        render(<FeaturedCredentialBubbles uris={['lc:boost:b', 'lc:boost:a']} owner={owner} />);

        fireEvent.click(screen.getByRole('button', { name: 'View featured credential: Mentor' }));

        expect(mocks.newModal).toHaveBeenCalledTimes(1);
        const { element, modalType } = lastModal();
        expect(modalType).toEqual({ desktop: 'full-screen', mobile: 'full-screen' });

        render(element);
        expect(mocks.preview).toHaveBeenCalledWith(
            expect.objectContaining({ credential: mentor, categoryType: 'Social Badge', owner })
        );
    });

    it('opens only one detail view for rapid repeated taps', () => {
        mocks.useResolveBoosts.mockReturnValue([resolved('lc:boost:b', credential('Mentor'))]);

        render(<FeaturedCredentialBubbles uris={['lc:boost:b']} owner={owner} />);
        const bubble = screen.getByRole('button', { name: 'View featured credential: Mentor' });

        fireEvent.click(bubble);
        fireEvent.click(bubble);

        expect(mocks.newModal).toHaveBeenCalledTimes(1);
    });

    it('allows reopening after the detail view closes itself or is dismissed', () => {
        mocks.useResolveBoosts.mockReturnValue([resolved('lc:boost:b', credential('Mentor'))]);

        render(<FeaturedCredentialBubbles uris={['lc:boost:b']} owner={owner} />);
        const bubble = screen.getByRole('button', { name: 'View featured credential: Mentor' });

        fireEvent.click(bubble);
        lastModal().element.props.onClose();
        expect(mocks.closeModal).toHaveBeenCalledTimes(1);

        fireEvent.click(bubble);
        expect(mocks.newModal).toHaveBeenCalledTimes(2);

        lastModal().options.onClose?.();
        fireEvent.click(bubble);
        expect(mocks.newModal).toHaveBeenCalledTimes(3);
    });
});
