import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CampaignApi } from './types';
import { CampaignMemberSearch } from './CampaignMemberSearch';

const member = (id: string) => ({
    did: `did:key:${id}`,
    profileId: id,
    displayName: `Member ${id}`,
});
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
    cleanup();
    vi.useRealTimers();
});
const mount = (
    searchProfiles = vi.fn<CampaignApi['searchProfiles']>().mockResolvedValue([]),
    disabled = false,
    self: Awaited<ReturnType<CampaignApi['getProfile']>> = undefined
) => {
    const onAdd = vi.fn(),
        onPreview = vi.fn();
    render(
        <CampaignMemberSearch
            api={{ searchProfiles, getProfile: vi.fn().mockResolvedValue(self) }}
            disabled={disabled}
            onAdd={onAdd}
            onPreview={onPreview}
        />
    );
    return { searchProfiles, onAdd, onPreview };
};
const search = async (term: string) => {
    fireEvent.change(screen.getByLabelText('Search network members'), { target: { value: term } });
    await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
    });
};

describe('network audience search', () => {
    it('merges a matching own profile and safely omits results without a visible account identifier', async () => {
        const own = { ...member('myself'), shortBio: '', bio: '' };
        mount(
            vi
                .fn()
                .mockResolvedValue([
                    { profileId: 'limited', displayName: 'Limited', shortBio: '' },
                ]),
            false,
            own
        );
        await search('myself');
        expect(
            screen.getByRole('checkbox', { name: 'Select Member myself (@myself)' })
        ).toBeInTheDocument();
        expect(screen.queryByRole('checkbox', { name: /Limited/ })).not.toBeInTheDocument();
        expect(screen.getByText(/Some profiles cannot be selected/)).toBeInTheDocument();
    });

    it('debounces network-wide search, includes self/services, and never adds on selection', async () => {
        const api = mount(vi.fn().mockResolvedValue([member('alice'), member('alice')]));
        await search('a');
        expect(api.searchProfiles).not.toHaveBeenCalled();
        fireEvent.change(screen.getByLabelText('Search network members'), {
            target: { value: 'alice' },
        });
        expect(screen.getByText('Searching members...')).toBeInTheDocument();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(300);
        });
        expect(api.searchProfiles).toHaveBeenCalledWith('alice', {
            limit: 50,
            includeSelf: false,
            includeServiceProfiles: true,
            includeConnectionStatus: false,
        });
        expect(screen.getAllByRole('checkbox')).toHaveLength(1);
        fireEvent.click(screen.getByRole('checkbox', { name: 'Select Member alice (@alice)' }));
        expect(api.onAdd).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Preview selected members' }));
        expect(api.onPreview).toHaveBeenCalledWith(['did:key:alice']);
        fireEvent.click(screen.getByRole('button', { name: 'Add selected members' }));
        expect(api.onAdd).toHaveBeenCalledWith(['did:key:alice']);
    });
    it('retains selection across queries, deduplicates selections and supports removal', async () => {
        const api = mount(
            vi
                .fn()
                .mockResolvedValueOnce([member('alice')])
                .mockResolvedValueOnce([member('bob'), member('alice')])
        );
        await search('alice');
        fireEvent.click(screen.getByRole('checkbox'));
        await search('bob');
        fireEvent.click(screen.getByRole('checkbox', { name: 'Select Member bob (@bob)' }));
        expect(
            screen.getByRole('checkbox', { name: 'Select Member alice (@alice)' })
        ).toBeChecked();
        expect(
            within(screen.getByRole('list', { name: 'Selected network members' })).getAllByRole(
                'button'
            )
        ).toHaveLength(2);
        fireEvent.click(screen.getByRole('button', { name: 'Remove Member alice (@alice)' }));
        fireEvent.click(screen.getByRole('button', { name: 'Add selected members' }));
        expect(api.onAdd).toHaveBeenCalledWith(['did:key:bob']);
        fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
        expect(screen.getByRole('button', { name: 'Add selected members' })).toBeDisabled();
    });
    it('ignores late responses from an earlier query', async () => {
        let resolveOld!: (value: ReturnType<typeof member>[]) => void;
        mount(
            vi
                .fn()
                .mockReturnValueOnce(
                    new Promise(resolve => {
                        resolveOld = resolve;
                    })
                )
                .mockResolvedValueOnce([member('new')])
        );
        await search('old');
        await search('new');
        await act(async () => resolveOld([member('old')]));
        expect(screen.queryByRole('checkbox', { name: /Member old/ })).not.toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: /Member new/ })).toBeInTheDocument();
    });
    it('shows friendly failure, retry and empty-result states', async () => {
        const api = mount(
            vi
                .fn()
                .mockRejectedValueOnce(new Error('private backend details'))
                .mockResolvedValueOnce([])
        );
        await search('alice');
        expect(screen.getByRole('alert')).not.toHaveTextContent('private backend details');
        fireEvent.click(screen.getByRole('button', { name: 'Retry member search' }));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(300);
        });
        expect(api.searchProfiles).toHaveBeenCalledTimes(2);
        expect(screen.getByText(/No members found/)).toBeInTheDocument();
    });
    it('locks searching and adding when the audience is disabled', async () => {
        const api = mount(undefined, true);
        expect(screen.getByLabelText('Search network members')).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Add selected members' })).toBeDisabled();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(500);
        });
        expect(api.searchProfiles).not.toHaveBeenCalled();
    });
});
