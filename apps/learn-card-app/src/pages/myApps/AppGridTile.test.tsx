import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AppGridTile from './AppGridTile';

describe('AppGridTile', () => {
    it('renders the title', () => {
        render(
            <AppGridTile
                title="Skill Insights"
                icon={<svg data-testid="ico" />}
                onClick={() => {}}
            />
        );
        expect(screen.getByText('Skill Insights')).toBeTruthy();
    });

    it('renders a node icon in gradient mode', () => {
        render(
            <AppGridTile
                title="Skill Insights"
                icon={<svg data-testid="ico" />}
                gradientFrom="#bef264"
                gradientTo="#84cc16"
                onClick={() => {}}
            />
        );
        expect(screen.getByTestId('ico')).toBeTruthy();
    });

    it('renders an <img> when icon is a string (image mode)', () => {
        render(
            <AppGridTile title="Earth Cubs" icon="https://example.com/i.png" onClick={() => {}} />
        );
        const img = screen.getByRole('img') as HTMLImageElement;
        expect(img.src).toContain('https://example.com/i.png');
        expect(img.alt).toBe('Earth Cubs');
    });

    it('fires onClick when activated', () => {
        const onClick = vi.fn();
        render(<AppGridTile title="Pathways" icon={<svg />} onClick={onClick} />);
        fireEvent.click(screen.getByRole('button', { name: /Pathways/i }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
