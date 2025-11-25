import React from 'react';

import { render } from '@testing-library/react';

import MainSubheader from './MainSubHeader';
import Providers from 'learn-card-base/../mocks/Providers';

describe('MainSubheader', () => {
    it('should render successfully', () => {
        const { baseElement } = render(
            <Providers>
                <MainSubheader />
            </Providers>
        );
        expect(baseElement).toBeTruthy();
    });
});
