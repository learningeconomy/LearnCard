import React from 'react';

import { render } from '@testing-library/react';

import NotificationsSubheader from './NotificationsSubheader';
import Providers from 'learn-card-base/../mocks/Providers';

describe('NotificationsSubheader', () => {
    it('should render successfully', () => {
        const { baseElement } = render(
            <Providers>
                <NotificationsSubheader />
            </Providers>
        );
        expect(baseElement).toBeTruthy();
    });
});
