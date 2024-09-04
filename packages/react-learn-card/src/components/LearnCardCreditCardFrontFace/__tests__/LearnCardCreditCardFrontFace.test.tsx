import { vi } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent, screen } from '@testing-library/react';

import LearnCardCreditCardFrontFace from '../LearnCardCreditCardFrontFace';

describe('LearnCardCreditCardFrontFace', () => {
    test('Checks LearnCardCreditCardFrontFace renders with props', () => {
        const handleOnClick = vi.fn();

        render(
            <LearnCardCreditCardFrontFace
                userImage="https://img.freepik.com/free-photo/pleasant-looking-serious-blonde-woman-with-long-hair-wears-blue-casual-sweater_273609-17050.jpg?w=2000"
                qrCodeValue="https://www.npmjs.com/package/@learncard/react"
                showActionButton
                actionButtonText="Open Card"
                onClick={handleOnClick}
                children={<div>I am a child</div>}
            />
        );

        const actionButton = screen.getByTestId('credit-card-frontface-button');

        expect(actionButton).toBeInTheDocument();
        expect(actionButton).toHaveTextContent('Open Card');

        fireEvent.click(actionButton);
        expect(handleOnClick).toHaveBeenCalledTimes(1);

        const userImage = screen.getByAltText('user image');
        expect(userImage).toHaveAttribute(
            'src',
            'https://img.freepik.com/free-photo/pleasant-looking-serious-blonde-woman-with-long-hair-wears-blue-casual-sweater_273609-17050.jpg?w=2000'
        );

        const qrCode = screen.queryByTestId('credit-card-qr-code');
        expect(qrCode).toBeInTheDocument();
    });

    test('Checks LearnCardCreditCardFrontFace renders without props', () => {
        render(<LearnCardCreditCardFrontFace />);

        expect(screen.queryByTestId('credit-card-frontface-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('credit-card-frontface-userImg')).not.toBeInTheDocument();
        expect(screen.queryByTestId('credit-card-qr-code')).not.toBeInTheDocument();
    });
});
