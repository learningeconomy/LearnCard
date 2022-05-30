import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import VCThumbnail from '../VCThumbnail';

describe('Running Tests for VCThumbnail', () => {
    test('Checks VCThumbnail renders with props', () => {
        render(
            <VCThumbnail
                title="This is a title!"
                createdAt="05/01/2022"
                issuerImage="https://issuerimage.png"
                userImage="https://userimage.png"
                onClick={() => {
                    console.log('Hello World');
                }}
            />
        );

        const title = screen.getByTestId('vc-thumbnail-title');
        expect(title).toHaveTextContent('This is a title!');

        const createdAt = screen.getByTestId('vc-thumbnail-createdAt');
        expect(createdAt).toHaveTextContent('05/01/2022');

        const issuerImage = screen.getByAltText('issuer image');
        expect(issuerImage).toHaveAttribute('src', 'https://issuerimage.png');

        const userImage = screen.getByAltText('user image');
        expect(userImage).toHaveAttribute('src', 'https://userimage.png');

        screen.debug();
    });

    test('Checks VCThumbnail renders without props', () => {
        render(<VCThumbnail />);

        const title = screen.getByTestId('vc-thumbnail-title');
        expect(title).toHaveTextContent('');

        const createdAt = screen.getByTestId('vc-thumbnail-createdAt');
        expect(createdAt).toHaveTextContent('');

        const issuerImage = screen.getByAltText('issuer image');
        expect(issuerImage).not.toHaveAttribute('src');

        const userImage = screen.getByAltText('user image');
        expect(userImage).not.toHaveAttribute('src');

        screen.debug();
    });
});
