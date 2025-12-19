import React from 'react';

import { render } from '@testing-library/react';

import AppUrlListener from './AppUrlListener';
import Providers from 'learn-card-base/../mocks/Providers';

describe('AppUrlListener', () => {
    it('should render successfully', () => {
        const { baseElement } = render(
            <Providers>
                <AppUrlListener />
            </Providers>
        );
        expect(baseElement).toBeTruthy();
    });
});
