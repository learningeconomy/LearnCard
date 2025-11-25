import React from 'react';

import { render } from '@testing-library/react';

import VCModal from './VCModal';
import Providers from 'learn-card-base/../mocks/Providers';

describe('VCModal', () => {
    it('should render successfully', () => {
        const { baseElement } = render(
            <Providers>
                <VCModal />
            </Providers>
        );
        expect(baseElement).toBeTruthy();
    });
});
