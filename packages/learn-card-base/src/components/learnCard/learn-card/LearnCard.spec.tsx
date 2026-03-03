import React from 'react';

import { render, waitFor } from '@testing-library/react';

import LearnCard from './LearnCard';
import Providers from 'learn-card-base/../mocks/Providers';

describe('LearnCard', () => {
    it('should render successfully', async () => {
        await waitFor(() => {
            const { baseElement } = render(
                <Providers>
                    <LearnCard />
                </Providers>
            );
            expect(baseElement).toBeTruthy();
        });
    });
});
