import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ShareLink } from '@learncard/types';

import ShareLinkRow from './ShareLinkRow';

vi.mock('@ionic/react', () => ({
    // Forward role/aria-label/etc. so icon-based assertions (e.g. the passcode
    // indicator) can be queried the same way they render in the real app.
    IonIcon: ({ icon, ...rest }: { icon?: string } & React.HTMLAttributes<HTMLSpanElement>) => (
        <span {...rest} />
    ),
}));

afterEach(cleanup);

const share = (overrides: Partial<ShareLink> = {}): ShareLink =>
    ({
        id: 'AAAAAAAAAAAAAAAAAAAAAA',
        title: 'Career highlights',
        selectedCount: 4,
        version: 1,
        contentVersion: 1,
        status: 'active',
        contentState: 'finalized',
        createdAt: '2026-09-12T14:30:00.000Z',
        updatedAt: '2026-09-12T14:30:00.000Z',
        expiresAt: null,
        stoppedAt: null,
        viewCount: 12,
        lastViewedAt: '2026-09-21T18:15:00.000Z',
        passcodeProtected: false,
        notifyOnView: false,
        ...overrides,
    }) as ShareLink;

describe('ShareLinkRow', () => {
    it('calls onOpen with the share when the row is clicked', () => {
        const onOpen = vi.fn();
        const onCopy = vi.fn(async () => true);
        render(
            <ul>
                <ShareLinkRow
                    share={share()}
                    pending={false}
                    busy={false}
                    showViewStats
                    onOpen={onOpen}
                    onCopy={onCopy}
                />
            </ul>
        );

        fireEvent.click(screen.getByText('Career highlights'));
        expect(onOpen).toHaveBeenCalledWith(share());
    });

    it('calls onCopy and not onOpen when the copy button is clicked', () => {
        const onOpen = vi.fn();
        const onCopy = vi.fn(async () => true);
        const record = share();
        render(
            <ul>
                <ShareLinkRow
                    share={record}
                    pending={false}
                    busy={false}
                    showViewStats
                    onOpen={onOpen}
                    onCopy={onCopy}
                />
            </ul>
        );

        fireEvent.click(screen.getByRole('button', { name: /copy link for career highlights/i }));
        expect(onCopy).toHaveBeenCalledWith(record);
        expect(onOpen).not.toHaveBeenCalled();
    });

    it('renders no copy button for a stopped share', () => {
        render(
            <ul>
                <ShareLinkRow
                    share={share({ status: 'stopped' })}
                    pending={false}
                    busy={false}
                    showViewStats
                    onOpen={vi.fn()}
                    onCopy={vi.fn(async () => true)}
                />
            </ul>
        );

        expect(screen.queryByRole('button', { name: /copy link/i })).toBeNull();
    });

    it('shows "Update in progress" for a pending share', () => {
        render(
            <ul>
                <ShareLinkRow
                    share={share()}
                    pending
                    busy={false}
                    showViewStats
                    onOpen={vi.fn()}
                    onCopy={vi.fn(async () => true)}
                />
            </ul>
        );

        expect(screen.getByText('Update in progress')).toBeTruthy();
    });

    it('disables the copy button while busy', () => {
        render(
            <ul>
                <ShareLinkRow
                    share={share()}
                    pending={false}
                    busy
                    showViewStats
                    onOpen={vi.fn()}
                    onCopy={vi.fn(async () => true)}
                />
            </ul>
        );

        expect(
            screen.getByRole('button', { name: /copy link for career highlights/i })
        ).toBeDisabled();
    });

    it('renders no copy button while the content is still staging (not yet finalized)', () => {
        render(
            <ul>
                <ShareLinkRow
                    share={share({ contentState: 'staging' })}
                    pending={false}
                    busy={false}
                    showViewStats
                    onOpen={vi.fn()}
                    onCopy={vi.fn(async () => true)}
                />
            </ul>
        );

        expect(screen.queryByRole('button', { name: /copy link/i })).toBeNull();
    });

    it('renders no copy button for an expired share', () => {
        render(
            <ul>
                <ShareLinkRow
                    share={share({ expiresAt: '2000-01-01T00:00:00.000Z' })}
                    pending={false}
                    busy={false}
                    showViewStats
                    onOpen={vi.fn()}
                    onCopy={vi.fn(async () => true)}
                />
            </ul>
        );

        expect(screen.queryByRole('button', { name: /copy link/i })).toBeNull();
    });

    it('shows a "Passcode protected" img for a passcode-protected share', () => {
        render(
            <ul>
                <ShareLinkRow
                    share={share({ passcodeProtected: true })}
                    pending={false}
                    busy={false}
                    showViewStats
                    onOpen={vi.fn()}
                    onCopy={vi.fn(async () => true)}
                />
            </ul>
        );

        expect(screen.getByRole('img', { name: 'Passcode protected' })).toBeTruthy();
    });

    it('shows no "Passcode protected" img for an unprotected share', () => {
        render(
            <ul>
                <ShareLinkRow
                    share={share({ passcodeProtected: false })}
                    pending={false}
                    busy={false}
                    showViewStats
                    onOpen={vi.fn()}
                    onCopy={vi.fn(async () => true)}
                />
            </ul>
        );

        expect(screen.getByText('Career highlights')).toBeTruthy();
        expect(screen.queryByRole('img', { name: 'Passcode protected' })).toBeNull();
    });
});
