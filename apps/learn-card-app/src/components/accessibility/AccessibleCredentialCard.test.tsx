import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AccessibleCredentialCard from './AccessibleCredentialCard';

describe('AccessibleCredentialCard', () => {
    it('keeps the primary credential card keyboard accessible', () => {
        const onClick = vi.fn();

        render(
            <AccessibleCredentialCard label="Applied Data Ethics credential">
                {/* Mirrors shared credential markup before the runtime accessibility enhancement. */}
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus */}
                <div role="button" onClick={onClick}>
                    Credential card
                </div>
            </AccessibleCredentialCard>
        );

        const card = screen.getByRole('button', {
            name: 'Applied Data Ethics credential',
        });

        expect(card.getAttribute('tabindex')).toBe('0');

        fireEvent.keyDown(card, { key: 'Enter' });
        fireEvent.keyDown(card, { key: ' ' });

        expect(onClick).toHaveBeenCalledTimes(2);
    });
});
