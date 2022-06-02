import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';

import MiniVCThumbnail from '../MiniVCThumbnail';

describe('Running Tests for MiniVCThumbnail', () => {
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

        fireEvent.click(getByTestId('mini-vc-thumbnail'));
        expect(handleOnClick).toHaveBeenCalledTimes(1);

        const title = getByTestId('mini-vc-thumbnail-title');
        expect(title).toHaveTextContent('This is a title!');

        const createdAt = getByTestId('mini-vc-thumbnail-createdAt');
        expect(createdAt).toHaveTextContent('05/01/2022');

        const issuerImage = getByAltText('issuer image');
        expect(issuerImage).toHaveAttribute('src', 'https://issuerimage.png');

        const badgeImage = getByAltText('badge image');
        expect(badgeImage).toHaveAttribute('src', 'https://badgeimage.png');
    });

    test('Checks MiniVCThumbnail renders without props', () => {
        const handleOnClick = jest.fn();

        const { getByTestId, queryByTestId } = render(<MiniVCThumbnail />);

        fireEvent.click(getByTestId('mini-vc-thumbnail'));
        expect(handleOnClick).not.toHaveBeenCalledTimes(1);

        const title = getByTestId('mini-vc-thumbnail-title');
        expect(title).toHaveTextContent('');

        const createdAt = getByTestId('mini-vc-thumbnail-createdAt');
        expect(createdAt).toHaveTextContent('');

        const issuerImage = queryByTestId('mini-vc-thumbnail-issuer');
        expect(issuerImage).not.toBeInTheDocument();

        const badgeImage = queryByTestId('mini-vc-thumbnail-badge');
        expect(badgeImage).not.toBeInTheDocument();
    });
});
