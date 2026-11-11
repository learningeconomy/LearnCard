import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { changeRosterDate, parseRosterDate, RosterDateInput } from './RosterDateInput';
vi.mock('../../../i18n', () => ({ useLocale: () => 'en' }));

describe('roster calendar editor', () => {
    it.each(['2026-02-30', '10/11/2026', '2026-10-01T00:00:00', 'not a date'])(
        'keeps ambiguous or invalid input unparsed: %s',
        value => {
            expect(parseRosterDate(value)).toBeUndefined();
        }
    );
    it('uses UTC across midnight offsets and preserves exact bytes until an explicit change', () => {
        const original = '2026-10-01T23:30:12.345-05:00';
        const onChange = vi.fn();
        render(
            <RosterDateInput
                aria-label="Completed date"
                value={original}
                onChange={onChange}
                className=""
            />
        );
        const input = screen.getByLabelText('Completed date');
        expect(input).toHaveValue('2026-10-02');
        expect(screen.getByText('Oct 2, 2026, 4:30 AM')).toBeVisible();
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.change(input, { target: { value: '2026-10-02' } });
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.change(input, { target: { value: '2026-10-03' } });
        expect(onChange).toHaveBeenCalledWith('2026-10-03T04:30:12.345Z');
    });
    it('shows a readable date with a native picker and saves explicit calendar edits as credential timestamps', () => {
        const onChange = vi.fn();
        render(
            <RosterDateInput
                aria-label="Completed date"
                value="2026-10-01"
                onChange={onChange}
                className=""
            />
        );
        expect(screen.getByText('Oct 1, 2026')).toBeVisible();
        const input = screen.getByLabelText('Completed date');
        expect(input).toHaveAttribute('type', 'date');
        fireEvent.change(input, { target: { value: '2026-10-04' } });
        expect(onChange).toHaveBeenCalledWith('2026-10-04T00:00:00.000Z');
        expect(changeRosterDate('2026-10-01', '')).toBe('');
    });
    it('preserves invalid source text visibly and lets the picker correct it', () => {
        const onChange = vi.fn();
        render(
            <RosterDateInput
                aria-label="Completed date"
                value="bad CSV date"
                onChange={onChange}
                className=""
            />
        );
        expect(screen.getByText('Original value: bad CSV date')).toBeVisible();
        expect(screen.getByLabelText('Completed date')).toHaveAttribute('aria-invalid', 'true');
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.change(screen.getByLabelText('Completed date'), {
            target: { value: '2026-10-01' },
        });
        expect(onChange).toHaveBeenCalledWith('2026-10-01T00:00:00.000Z');
    });
    it('writes midnight UTC when choosing a date for an empty credential field', () => {
        const onChange = vi.fn();
        render(
            <RosterDateInput
                aria-label="Completed date"
                value=""
                onChange={onChange}
                className=""
            />
        );
        fireEvent.change(screen.getByLabelText('Completed date'), {
            target: { value: '2026-10-01' },
        });
        expect(onChange).toHaveBeenCalledWith('2026-10-01T00:00:00.000Z');
        expect(changeRosterDate('2026-10-01', '2026-10-01')).toBe('2026-10-01');
    });
    it('leaves submitted dates locked', () => {
        render(
            <RosterDateInput
                aria-label="Completed date"
                value="2026-10-01T00:00:00.000Z"
                onChange={vi.fn()}
                className=""
                disabled
            />
        );
        expect(screen.getByLabelText('Completed date')).toBeDisabled();
        expect(screen.getByText('Oct 1, 2026')).toBeVisible();
    });
});
