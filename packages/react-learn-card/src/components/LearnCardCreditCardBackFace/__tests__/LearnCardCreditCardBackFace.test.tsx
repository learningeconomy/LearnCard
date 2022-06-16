import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import LearnCardCreditCardBackFace from '../LearnCardCreditCardBackFace';
import { LearnCardCreditCardUserProps, LearnCardCreditCardProps } from '../types';

describe('Running Tests for LearnCardCreditCardBackFace', () => {
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

        const { getByTestId } = render(<LearnCardCreditCardBackFace user={user} card={card} />);

        const fullName = getByTestId('credit-card-backface-fullname');
        expect(fullName).toHaveTextContent('Jane Doe');

        const username = getByTestId('credit-card-backface-username');
        expect(username).toHaveTextContent('jane_doe_2022');

        const cardNumber = getByTestId('credit-card-backface-cardNum');
        expect(cardNumber).toHaveTextContent('0000 0000 0000 0000');

        const cardIssueDate = getByTestId('credit-card-backface-issueDate');
        expect(cardIssueDate).toHaveTextContent('2022');

        const cardExpDate = getByTestId('credit-card-backface-expDate');
        expect(cardExpDate).toHaveTextContent('EXP 00/00');

        const cardSecurityCode = getByTestId('credit-card-backface-secCode');
        expect(cardSecurityCode).toHaveTextContent('SEC 000');
    });

    test('Checks LearnCardCreditCardBackFace renders without props', () => {
        const { getByTestId, queryByTestId } = render(<LearnCardCreditCardBackFace />);

        const fullName = getByTestId('credit-card-backface-fullname');
        expect(fullName).toBeEmptyDOMElement();

        const username = queryByTestId('credit-card-backface-username');
        expect(username).not.toBeInTheDocument();

        const cardNumber = getByTestId('credit-card-backface-cardNum');
        expect(cardNumber).toBeEmptyDOMElement();

        const cardIssueDate = queryByTestId('credit-card-backface-issueDate');
        expect(cardIssueDate).not.toBeInTheDocument();

        const cardExpDate = getByTestId('credit-card-backface-expDate');
        expect(cardExpDate).toHaveTextContent('EXP');

        const cardSecurityCode = queryByTestId('credit-card-backface-secCode');
        expect(cardSecurityCode).not.toBeInTheDocument();
    });
});
