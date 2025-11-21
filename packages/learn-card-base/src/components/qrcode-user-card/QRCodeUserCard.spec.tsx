import React from 'react';

import { render, waitFor } from '@testing-library/react';

import QRCodeUserCard from './QRCodeUserCard';
import Providers from 'learn-card-base/../mocks/Providers';

describe('QRCodeUserCard', () => {
    it('should render successfully', async () => {
        await waitFor(() => {
            const { baseElement } = render(
                <Providers>
                    <QRCodeUserCard />
                </Providers>
            );
            expect(baseElement).toBeTruthy();
        });
    });
});
