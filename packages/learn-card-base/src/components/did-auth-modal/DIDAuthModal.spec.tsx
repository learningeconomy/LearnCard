import React from 'react';

import { render } from '@testing-library/react';

import DIDAuthModal from './DIDAuthModal';
import Providers from 'learn-card-base/../mocks/Providers';

describe('DIDAuthModal', () => {
    it('should render successfully', () => {
        const { baseElement } = render(
            <Providers>
                <DIDAuthModal />
            </Providers>
        );
        expect(baseElement).toBeTruthy();
    });
});
