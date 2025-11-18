import React from 'react';

import { render } from '@testing-library/react';

import MobileNavDot from './MobileNavDot';
import Providers from 'learn-card-base/../mocks/Providers';

describe('MobileNavDot', () => {
    it('should render successfully', () => {
        const { baseElement } = render(
            <Providers>
                <MobileNavDot />
            </Providers>
        );
        expect(baseElement).toBeTruthy();
    });
});
