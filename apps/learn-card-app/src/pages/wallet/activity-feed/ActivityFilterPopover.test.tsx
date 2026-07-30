vi.mock('learn-card-base', async () =>
    (await import('../../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()
);
// Chip icons come from the theme store; stub it (no ThemeProvider in this test).
vi.mock('../../../theme/hooks/useTheme', () => ({
    useTheme: () => ({ getThemedCategory: () => ({ icons: {} }) }),
}));
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CredentialCategoryEnum } from 'learn-card-base';
import { ActivityFilterPopover } from './ActivityFilterPopover';

describe('ActivityFilterPopover', () => {
    it('renders All + the 7 category chips', () => {
        const { getByText } = render(
            <ActivityFilterPopover selected="all" onApply={vi.fn()} onReset={vi.fn()} />
        );
        [
            'All',
            'Badges',
            'Achievements',
            'Courses',
            'Portfolio',
            'Assistance',
            'Experiences',
            'IDs',
        ].forEach(label => expect(getByText(label)).toBeTruthy());
    });
    it('calls onApply with the chosen filter id', () => {
        const onApply = vi.fn();
        const { getByText } = render(
            <ActivityFilterPopover selected="all" onApply={onApply} onReset={vi.fn()} />
        );
        fireEvent.click(getByText('Achievements'));
        fireEvent.click(getByText('Apply Filter'));
        expect(onApply).toHaveBeenCalledWith(CredentialCategoryEnum.achievement);
    });
    it('calls onReset when Reset is clicked', () => {
        const onReset = vi.fn();
        const { getByText } = render(
            <ActivityFilterPopover
                selected={CredentialCategoryEnum.id}
                onApply={vi.fn()}
                onReset={onReset}
            />
        );
        fireEvent.click(getByText('Reset'));
        expect(onReset).toHaveBeenCalled();
    });
});
