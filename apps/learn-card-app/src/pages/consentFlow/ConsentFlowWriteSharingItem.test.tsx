import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { setLocale } from '../../paraglide/runtime.js';
import ConsentFlowWriteSharingItem, { currentWriteMode } from './ConsentFlowWriteSharingItem';

vi.mock('learn-card-base', () => ({ ProfilePicture: () => null }));
vi.mock('../../helpers/contract.helpers', () => ({
    getInfoFromContractKey: () => ({ title: 'Achievement' }),
}));
vi.mock('../../i18n/categoryTitle', () => ({ localizeCategoryTitle: (title: string) => title }));
beforeEach(() => setLocale('en', { reload: false }));
afterEach(cleanup);

const show = ({
    term,
    canWrite,
    directAllowed,
    required = false,
}: {
    term: boolean;
    canWrite?: boolean;
    directAllowed: boolean;
    required?: boolean;
}) => {
    const setTerm = vi.fn();
    const setCanWrite = vi.fn();
    render(
        <ul>
            <ConsentFlowWriteSharingItem
                term={term}
                setTerm={setTerm}
                category="Achievement"
                required={required}
                writeMode={{ canWrite, setCanWrite, directAllowed }}
            />
        </ul>
    );
    return { setTerm, setCanWrite };
};

const checked = () =>
    screen
        .getAllByRole('radio')
        .filter(radio => radio.getAttribute('aria-checked') === 'true')
        .map(radio => radio.textContent);

describe('write categories offer Off / Suggest only / Add directly (LC-2423)', () => {
    it('reads the effective mode from the terms and the contract', () => {
        const control = { setCanWrite: vi.fn() };
        expect(currentWriteMode(false, { ...control, canWrite: true, directAllowed: true })).toBe(
            'off'
        );
        expect(
            currentWriteMode(true, { ...control, canWrite: undefined, directAllowed: true })
        ).toBe('direct');
        expect(currentWriteMode(true, { ...control, canWrite: false, directAllowed: true })).toBe(
            'suggest'
        );
        expect(currentWriteMode(true, { ...control, canWrite: true, directAllowed: false })).toBe(
            'suggest'
        );
    });

    it('shows all three choices when the contract allows direct writes', () => {
        const { setTerm, setCanWrite } = show({ term: true, canWrite: false, directAllowed: true });
        expect(screen.getByRole('radiogroup', { name: 'How this app can add Achievement' }));
        expect(screen.getAllByRole('radio').map(radio => radio.textContent)).toEqual([
            'Off',
            'Suggest only',
            'Add directly',
        ]);
        expect(checked()).toEqual(['Suggest only']);

        fireEvent.click(screen.getByRole('radio', { name: 'Add directly' }));
        expect(setTerm).toHaveBeenLastCalledWith(true);
        expect(setCanWrite).toHaveBeenLastCalledWith(true);

        fireEvent.click(screen.getByRole('radio', { name: 'Off' }));
        expect(setTerm).toHaveBeenLastCalledWith(false);
        expect(setCanWrite).toHaveBeenLastCalledWith(false);
    });

    it('hides Add directly when the contract says suggest only', () => {
        const { setTerm, setCanWrite } = show({ term: false, directAllowed: false });
        expect(screen.getAllByRole('radio').map(radio => radio.textContent)).toEqual([
            'Off',
            'Suggest only',
        ]);
        expect(checked()).toEqual(['Off']);
        fireEvent.click(screen.getByRole('radio', { name: 'Suggest only' }));
        expect(setTerm).toHaveBeenLastCalledWith(true);
        expect(setCanWrite).toHaveBeenLastCalledWith(false);
    });

    it('never offers Off for a required category', () => {
        show({ term: true, directAllowed: true, required: true });
        expect(screen.getAllByRole('radio').map(radio => radio.textContent)).toEqual([
            'Suggest only',
            'Add directly',
        ]);
        expect(checked()).toEqual(['Add directly']);
    });
});
