import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';

import VCThumbnail from '../VCThumbnail';

describe('Running Tests for VCThumbnail', () => {
    test('Checks VCThumbnail renders with props', () => {
        const handleOnClick = jest.fn();

        const { getByTestId, getByAltText } = render(
            <VCThumbnail
                title="This is a title!"
                createdAt="05/01/2022"
                issuerImage="https://issuerimage.png"
                userImage="https://userimage.png"
                onClick={handleOnClick}
            />
        );

        fireEvent.click(getByTestId('vc-thumbnail-title'));
        expect(handleOnClick).toHaveBeenCalledTimes(1);

        const title = getByTestId('vc-thumbnail-title');
        expect(title).toHaveTextContent('This is a title!');

        const createdAt = getByTestId('vc-thumbnail-createdAt');
        expect(createdAt).toHaveTextContent('05/01/2022');

        const issuerImage = getByAltText('issuer image');
        expect(issuerImage).toHaveAttribute('src', 'https://issuerimage.png');

        const userImage = getByAltText('user image');
        expect(userImage).toHaveAttribute('src', 'https://userimage.png');
    });

    test('Checks VCThumbnail renders without props', () => {
        const handleOnClick = jest.fn();

        const { getByTestId, getByAltText } = render(<VCThumbnail />);

        fireEvent.click(getByTestId('vc-thumbnail-title'));
        expect(handleOnClick).not.toHaveBeenCalledTimes(1);

        const title = getByTestId('vc-thumbnail-title');
        expect(title).toHaveTextContent('');

        const createdAt = getByTestId('vc-thumbnail-createdAt');
        expect(createdAt).toHaveTextContent('');

        const issuerImage = getByAltText('issuer image');
        expect(issuerImage).not.toHaveAttribute('src');

        const userImage = getByAltText('user image');
        expect(userImage).not.toHaveAttribute('src');
    });
});
