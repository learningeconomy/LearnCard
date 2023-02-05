import React from 'react';

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import FlippyCard from '../FlippyCard';

describe('FlippyCard', () => {
    it('should not render without children', () => {
        render(<FlippyCard></FlippyCard>);
        expect(screen.queryByTestId('flippy-card-wrapper')).not.toBe();
    });

    it('should render the first and second child as the front and back face', async () => {
        render(
            <FlippyCard>
                <div>Front Side</div>
                <div>Back Side</div>
            </FlippyCard>
        );

        expect(screen.getByTestId('flippy-card-front')).toContainHTML('<div>Front Side</div>');
        expect(screen.getByTestId('flippy-card-back')).toContainHTML('<div>Back Side</div>');
    });

    it('should not render extra children components', async () => {
        render(
            <FlippyCard>
                <div>Front Side</div>
                <div>Back Side</div>
                <div>Extra Child</div>
            </FlippyCard>
        );

        expect(screen.getByTestId('flippy-card-front')).not.toContainHTML('<div>Extra Child</div>');
        expect(screen.getByTestId('flippy-card-back')).not.toContainHTML('<div>Extra Child</div>');
        expect(screen.getByTestId('flippy-card-wrapper')).not.toContainHTML(
            '<div>Extra Child</div>'
        );
    });
});
