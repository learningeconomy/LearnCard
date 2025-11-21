import React from 'react';

import { render } from '@testing-library/react';

import WalletBlockList from './WalletBlockList';
import Providers from 'learn-card-base/../mocks/Providers';

describe('WalletBlockList', () => {
    it('should render successfully', () => {
        const { baseElement } = render(
            <Providers>
                <WalletBlockList />
            </Providers>
        );
        expect(baseElement).toBeTruthy();
    });
});
