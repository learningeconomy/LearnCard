import React from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const host = vi.hoisted(() => ({
    collection: {
        records: [] as { uri: string; title: string; date?: string }[],
        isComplete: false,
        isError: false,
        isFetching: false,
        retry: vi.fn(),
    },
    open: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    useCredentialCollection: () => host.collection,
    useModal: () => ({ newModal: host.open, closeModal: vi.fn() }),
    ModalTypes: { FullScreen: 'full-screen' },
}));
vi.mock('./PassportCredentialCard', () => ({
    default: ({ record }: { record: { title: string } }) => <article>{record.title}</article>,
}));
vi.mock('./AllCredentialsModal', () => ({ AllCredentialsModal: () => <div>Full collection</div> }));
import { RecentlyAdded } from './RecentlyAdded';

beforeEach(() =>
    Object.assign(host.collection, {
        records: [],
        isComplete: false,
        isError: false,
        isFetching: false,
    })
);
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('Recently added', () => {
    it.each(['loading', 'failed', 'empty'])(
        'keeps All credentials reachable when recent items are %s',
        state => {
            Object.assign(host.collection, {
                isComplete: state === 'empty',
                isError: state === 'failed',
            });
            render(<RecentlyAdded />);
            const seeAll = screen.getByRole('button', { name: 'See all' });
            seeAll.focus();
            fireEvent.click(seeAll);
            expect(host.open).toHaveBeenCalledTimes(1);
            if (state !== 'empty')
                expect(screen.queryByText('Nothing in your passport yet.')).toBeNull();
            if (state === 'failed')
                expect(
                    screen.getByRole('button', { name: 'Retry recent credentials' })
                ).toBeTruthy();
        }
    );
    it('retains available cards during failure and caps the newest records at five', () => {
        host.collection.records = [3, 1, 5, 2, 0, 4, 6, 7].map(i => ({
            uri: `uri-${i}`,
            title: `Badge ${i}`,
            date: `2026-10-${String(20 - i).padStart(2, '0')}`,
        }));
        host.collection.isError = true;
        render(<RecentlyAdded />);
        expect(screen.getAllByRole('article').map(card => card.textContent)).toEqual([
            'Badge 0',
            'Badge 1',
            'Badge 2',
            'Badge 3',
            'Badge 4',
        ]);
        expect(screen.queryByText('Badge 5')).toBeNull();
        expect(screen.getByRole('status').textContent).toContain('incomplete');
        fireEvent.click(screen.getByRole('button', { name: 'Retry recent credentials' }));
        expect(host.collection.retry).toHaveBeenCalledTimes(1);
    });
});
