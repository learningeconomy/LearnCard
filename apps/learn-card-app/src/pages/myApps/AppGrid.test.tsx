import React from 'react';
import { render, screen } from '@testing-library/react';
import AppGrid from './AppGrid';

describe('AppGrid', () => {
    it('renders the section heading and children', () => {
        render(
            <AppGrid heading="LearnCard Apps">
                <div>child-a</div>
                <div>child-b</div>
            </AppGrid>
        );
        expect(screen.getByText('LearnCard Apps')).toBeTruthy();
        expect(screen.getByText('child-a')).toBeTruthy();
        expect(screen.getByText('child-b')).toBeTruthy();
    });

    it('uses a 3-column phone / 4-column tablet-and-up grid', () => {
        const { container } = render(<AppGrid heading="More Apps">{null}</AppGrid>);
        const grid = container.querySelector('[data-testid="app-grid"]')!;
        expect(grid.className).toContain('grid-cols-3');
        expect(grid.className).toContain('sm:grid-cols-4');
    });
});
