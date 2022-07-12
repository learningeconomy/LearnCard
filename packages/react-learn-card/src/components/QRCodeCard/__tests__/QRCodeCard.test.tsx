import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import QRCodeCard from '../QRCodeCard';

describe('QRCodeCard', () => {
    test('Checks QRCodeCard renders with props', () => {
        const userHandle = '@janetyoon';

        render(
            <QRCodeCard
                userHandle={userHandle}
                qrCodeValue="https://www.npmjs.com/package/@learncard/react"
            />
        );

        const userHandleEl = screen.getByText(userHandle);
        expect(userHandleEl).toBeInTheDocument();

        const qrcodeCard = screen.queryByTestId('qrcode-card');
        expect(qrcodeCard).toBeInTheDocument();
    });

    test('Checks QRCodeCard renders without props', () => {
        render(<QRCodeCard />);

        expect(screen.queryByTestId('qrcode-card-user-handle')).not.toBeInTheDocument();
        expect(screen.queryByTestId('qrcode-card')).not.toBeInTheDocument();
    });
});
