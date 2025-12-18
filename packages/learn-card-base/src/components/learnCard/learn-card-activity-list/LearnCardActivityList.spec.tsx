import React from 'react';

import { render } from '@testing-library/react';

import LearnCardActivityList from './LearnCardActivityList';
import Providers from 'learn-card-base/../mocks/Providers';

describe('LearnCardActivityList', () => {
    it('should render successfully', () => {
        const { baseElement } = render(
            <Providers>
                <LearnCardActivityList />
            </Providers>
        );
        expect(baseElement).toBeTruthy();
    });
});
