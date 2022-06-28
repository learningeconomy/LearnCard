import React from 'react';

import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';

import FlippyCard from '../FlippyCard';

describe('FlippyCard', () => {
    it('should not render without children', () => {
        const { queryByTestId } = render(<FlippyCard></FlippyCard>);
        expect(queryByTestId('flippy-card-wrapper')).not.toBe();
    });

    it('should flip when clicked', () => {
        const { getByTestId } = render(<FlippyCard><div>Front Side</div><div>Back Side</div></FlippyCard>)

        expect(getByTestId('flippy-card')).not.toHaveClass('is-flipped');

        fireEvent.click(getByTestId('flippy-card'));
        expect(getByTestId('flippy-card')).toHaveClass('is-flipped');

        fireEvent.click(getByTestId('flippy-card'));
        expect(getByTestId('flippy-card')).not.toHaveClass('is-flipped');

    });

    it('should render the first and second child as the front and back face', () => {
        const { getByTestId } = render(<FlippyCard><div>Front Side</div><div>Back Side</div></FlippyCard>);

        expect(getByTestId('flippy-card-front')).toContainHTML('<div>Front Side</div>');
        expect(getByTestId('flippy-card-back')).toContainHTML('<div>Back Side</div>');
    });


    it('should not render extra children components', () => {
        const { getByTestId } = render(<FlippyCard><div>Front Side</div><div>Back Side</div><div>Extra Child</div></FlippyCard>);

        expect(getByTestId('flippy-card-front')).not.toContainHTML('<div>Extra Child</div>');
        expect(getByTestId('flippy-card-back')).not.toContainHTML('<div>Extra Child</div>');
    });

});
