import React from 'react';

import { render } from '@testing-library/react';

import NotificationsList from './NotificationsList';
import Providers from 'learn-card-base/../mocks/Providers';

describe('NotificationsList', () => {
    it('should render successfully', () => {
        const { baseElement } = render(
            <Providers>
                <NotificationsList notifications={[]} />
            </Providers>
        );
        expect(baseElement).toBeTruthy();
    });
});
