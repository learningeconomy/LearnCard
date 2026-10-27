import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RecipientPreviewControls } from './RecipientPreviewControls';
import { makeRun } from './fixtures.test-support';
import { recipientKey } from '../components/recipientTypes';
import { effectiveRowValues } from './roster';

const recipients = makeRun(3).draft.recipients;
const Preview = ({ rows = recipients }: { rows?: typeof recipients }) => {
    const [index, setIndex] = useState(0);
    const selected = rows[Math.min(index, rows.length - 1)];
    return (
        <>
            <RecipientPreviewControls recipients={rows} index={index} onChange={setIndex} />
            {selected && (
                <output>
                    {
                        effectiveRowValues(
                            selected,
                            ['score'],
                            { score: 'perRecipient' },
                            {},
                            Object.fromEntries(
                                recipients.map((row, i) => [
                                    recipientKey(row),
                                    { score: String(i * 10) },
                                ])
                            )
                        ).score
                    }
                </output>
            )}
        </>
    );
};

describe('recipient preview navigation', () => {
    it('steps the selected row and its values without wrapping past either end', () => {
        render(<Preview />);
        const previous = screen.getByRole('button', { name: 'Previous person' });
        const next = screen.getByRole('button', { name: 'Next person' });
        expect(previous).toBeDisabled();
        expect(screen.getByRole('status')).toHaveTextContent('0');
        fireEvent.click(next);
        expect(screen.getByText('2 of 3 · Person1')).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('10');
        fireEvent.click(next);
        expect(next).toBeDisabled();
        expect(screen.getByRole('status')).toHaveTextContent('20');
        fireEvent.click(previous);
        expect(screen.getByRole('status')).toHaveTextContent('10');
    });
    it('clamps after removing recipients and hides controls for an empty roster', () => {
        const view = render(<Preview />);
        fireEvent.click(screen.getByRole('button', { name: 'Next person' }));
        fireEvent.click(screen.getByRole('button', { name: 'Next person' }));
        view.rerender(<Preview rows={recipients.slice(0, 2)} />);
        expect(screen.getByText('2 of 2 · Person1')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Previous person' }));
        expect(screen.getByRole('status')).toHaveTextContent('0');
        view.rerender(<Preview rows={[]} />);
        expect(screen.queryByRole('button')).toBeNull();
    });
});
