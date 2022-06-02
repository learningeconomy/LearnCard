import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';

import MiniVCThumbnail from '../MiniVCThumbnail';

describe('Running Tests for MiniVCThumbnail Full View', () => {
    test('Checks MiniVCThumbnail renders with props', () => {
        const handleOnClick = jest.fn();

        const { getByTestId, getByAltText } = render(
            <MiniVCThumbnail
                title="This is a title!"
                createdAt="05/01/2022"
                issuerImage="https://issuerimage.png"
                badgeImage="https://badgeimage.png"
                listView={false}
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

        const badgeImage = getByAltText('badge image');
        expect(badgeImage).toHaveAttribute('src', 'https://badgeimage.png');
    });

    test('Checks MiniVCThumbnail renders without props', () => {
        const handleOnClick = jest.fn();

        const { getByTestId, getByAltText } = render(<MiniVCThumbnail />);

        fireEvent.click(getByTestId('vc-thumbnail-title'));
        expect(handleOnClick).not.toHaveBeenCalledTimes(1);

        const title = getByTestId('vc-thumbnail-title');
        expect(title).toHaveTextContent('');

        const createdAt = getByTestId('vc-thumbnail-createdAt');
        expect(createdAt).toHaveTextContent('');

        const issuerImage = getByAltText('issuer image');
        expect(issuerImage).not.toHaveAttribute('src');

        const badgeImage = getByAltText('badge image');
        expect(badgeImage).not.toHaveAttribute('src');
    });
});
