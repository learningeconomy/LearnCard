import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpreadsheetReview } from './SpreadsheetUpload';
import { readSpreadsheetText } from './parseSpreadsheet';

vi.mock('learn-card-base', () => ({
    useModal: () => ({}),
    ModalTypes: { Center: 'center', FullScreen: 'fullscreen' },
}));
describe('spreadsheet import review', () => {
    it('bounds its preview and keeps invalid emails available for correction after import', async () => {
        const source = readSpreadsheetText(
            'Email,Name\n' +
                Array.from(
                    { length: 250 },
                    (_, i) => `${i ? `person${i}@test.com` : 'invalid'},Person ${i}`
                ).join('\n')
        );
        const onImport = vi.fn().mockResolvedValue(undefined);
        const onClose = vi.fn();
        render(<SpreadsheetReview source={source} onImport={onImport} onClose={onClose} />);
        expect(screen.getByText('Showing 8 of 250 people.')).toBeVisible();
        expect(screen.getByText('Needs attention · 1')).toBeVisible();
        expect(screen.queryByText('Person 249')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Add People' }));
        await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
        expect(onImport.mock.calls[0][0].rows).toHaveLength(250);
        expect(onImport.mock.calls[0][0].rows[0].email).toBe('invalid');
    });
    it('keeps the review open with a friendly error when saving the import fails', async () => {
        const onClose = vi.fn();
        render(
            <SpreadsheetReview
                source={readSpreadsheetText('Email\nada@test.com')}
                onImport={vi.fn().mockRejectedValue(new Error('private failure'))}
                onClose={onClose}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Add People' }));
        expect(await screen.findByRole('alert')).not.toHaveTextContent('private failure');
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Add People' })).toBeEnabled();
    });
});
