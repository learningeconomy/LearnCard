import React from 'react';

import { render, waitFor } from '@testing-library/react';

import QRCodeScannerButton from './QRCodeScannerButton';
import Providers from 'learn-card-base/../mocks/Providers';

describe('QRCodeScannerButton', () => {
    it('should render successfully', async () => {
        await waitFor(() => {
            const { baseElement } = render(
                <Providers>
                    <QRCodeScannerButton />
                </Providers>
            );
            expect(baseElement).toBeTruthy();
        });
    });
});
