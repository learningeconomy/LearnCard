// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Overlay } from './Overlay';

describe('Overlay', () => {
    it('escapes parent stacking contexts', () => {
        render(
            <div data-testid="stacking-context" style={{ transform: 'translateZ(0)' }}>
                <Overlay>
                    <div role="dialog">Modal content</div>
                </Overlay>
            </div>
        );

        expect(screen.getByTestId('stacking-context').contains(screen.getByRole('dialog'))).toBe(
            false
        );
    });
});
