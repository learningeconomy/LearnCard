import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';

import VCThumbnail from '../VCThumbnail';

describe('Running Tests for VCThumbnail Full View', () => {
    test('Checks VCThumbnail renders with props', () => {
        const handleOnClick = jest.fn();

        const { getByTestId, getByAltText } = render(
            <VCThumbnail
                title="This is a title!"
                createdAt="05/01/2022"
                issuerImage="https://issuerimage.png"
                userImage="https://userimage.png"
                badgeImage="https://badgeimage.png"
                listView={false}
                onClick={handleOnClick}
            />
        );

        fireEvent.click(getByTestId('vc-thumbnail'));
        expect(handleOnClick).toHaveBeenCalledTimes(1);

        const title = getByTestId('vc-thumbnail-title');
        expect(title).toHaveTextContent('This is a title!');

        const createdAt = getByTestId('vc-thumbnail-createdAt');
        expect(createdAt).toHaveTextContent('05/01/2022');

        const issuerImage = getByAltText('issuer image');
        expect(issuerImage).toHaveAttribute('src', 'https://issuerimage.png');

        const userImage = getByAltText('user image');
        expect(userImage).toHaveAttribute('src', 'https://userimage.png');

        const badgeImage = getByAltText('badge image');
        expect(badgeImage).toHaveAttribute('src', 'https://badgeimage.png');
    });

    test('Checks VCThumbnail renders without props', () => {
        const handleOnClick = jest.fn();

        const { getByTestId, getByAltText, queryByTestId, queryByAltText } = render(
            <VCThumbnail />
        );

        fireEvent.click(getByTestId('vc-thumbnail'));
        expect(handleOnClick).not.toHaveBeenCalledTimes(1);

        const title = getByTestId('vc-thumbnail-title');
        expect(title).toBeEmptyDOMElement();

        const createdAt = getByTestId('vc-thumbnail-createdAt');
        expect(createdAt).toBeEmptyDOMElement();

        const issuerImage = getByAltText('issuer image');
        expect(issuerImage).not.toHaveAttribute('src');

        const userImage = queryByAltText('user image');
        expect(userImage).not.toBeInTheDocument();

        const imageElement = queryByTestId('vc-thumbnail-badge');
        expect(imageElement).not.toBeInTheDocument();
    });
});

describe('Running Tests for VCThumbnail List View', () => {
    test('Checks VCThumbnail List View renders with props', () => {
        const handleOnClick = jest.fn();

        const { getByTestId, getByAltText } = render(
            <VCThumbnail
                title="This is a title!"
                createdAt="05/01/2022"
                issuerImage="https://issuerimage.png"
                listView
                onClick={handleOnClick}
            />
        );

        fireEvent.click(getByTestId('vc-thumbnail-list-view'));
        expect(handleOnClick).toHaveBeenCalledTimes(1);

        const title = getByTestId('vc-thumbnail-title');
        expect(title).toHaveTextContent('This is a title!');

        const createdAt = getByTestId('vc-thumbnail-createdAt');
        expect(createdAt).toHaveTextContent('05/01/2022');

        const issuerImage = getByAltText('issuer image');
        expect(issuerImage).toHaveAttribute('src', 'https://issuerimage.png');
    });

    test('Checks VCThumbnail List View renders without props', () => {
        const handleOnClick = jest.fn();

        const { getByTestId, queryByTestId } = render(<VCThumbnail listView />);

        fireEvent.click(getByTestId('vc-thumbnail-list-view'));
        expect(handleOnClick).not.toHaveBeenCalledTimes(1);

        const title = getByTestId('vc-thumbnail-title');
        expect(title).toBeEmptyDOMElement();

        const createdAt = getByTestId('vc-thumbnail-createdAt');
        expect(createdAt).toBeEmptyDOMElement();

        const imageElement = queryByTestId('vc-thumbnail-image');
        expect(imageElement).not.toBeInTheDocument();
    });
});
