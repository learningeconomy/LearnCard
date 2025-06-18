import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import LearnCardCreditCardBackFace from '../LearnCardCreditCardBackFace';
import type { LearnCardCreditCardUserProps, LearnCardCreditCardProps } from '../types';

describe('LearnCardCreditCardBackFace', () => {
    test('Checks LearnCardCreditCardBackFace renders with props', () => {
        const user: LearnCardCreditCardUserProps = {
            fullName: 'Jane Doe',
            username: 'jane_doe_2022',
        };

        const card: LearnCardCreditCardProps = {
            cardNumber: '0000 0000 0000 0000',
            cardIssueDate: '2022',
            cardExpirationDate: '00/00',
            cardSecurityCode: '000',
        };

        render(<LearnCardCreditCardBackFace user={user} card={card} />);

        const fullName = screen.getByTestId('credit-card-backface-fullname');
        expect(fullName).toHaveTextContent('Jane Doe');

        const username = screen.getByTestId('credit-card-backface-username');
        expect(username).toHaveTextContent('jane_doe_2022');

        const cardNumber = screen.getByTestId('credit-card-backface-cardNum');
        expect(cardNumber).toHaveTextContent('0000 0000 0000 0000');

        const cardIssueDate = screen.getByTestId('credit-card-backface-issueDate');
        expect(cardIssueDate).toHaveTextContent('2022');

        const cardExpDate = screen.getByTestId('credit-card-backface-expDate');
        expect(cardExpDate).toHaveTextContent('EXP 00/00');

        const cardSecurityCode = screen.getByTestId('credit-card-backface-secCode');
        expect(cardSecurityCode).toHaveTextContent('SEC 000');
    });

    test('Checks LearnCardCreditCardBackFace renders without props', () => {
        render(<LearnCardCreditCardBackFace />);

        const fullName = screen.getByTestId('credit-card-backface-fullname');
        expect(fullName).toBeEmptyDOMElement();

        const username = screen.queryByTestId('credit-card-backface-username');
        expect(username).not.toBeInTheDocument();

        const cardNumber = screen.getByTestId('credit-card-backface-cardNum');
        expect(cardNumber).toBeEmptyDOMElement();

        const cardIssueDate = screen.queryByTestId('credit-card-backface-issueDate');
        expect(cardIssueDate).not.toBeInTheDocument();

        const cardExpDate = screen.getByTestId('credit-card-backface-expDate');
        expect(cardExpDate).toHaveTextContent('EXP');

        const cardSecurityCode = screen.queryByTestId('credit-card-backface-secCode');
        expect(cardSecurityCode).not.toBeInTheDocument();
    });
});
