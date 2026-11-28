import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppOverlayManager } from '../src/ui/overlays';

const client = new QueryClient();

const Providers: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    return (
        <BrowserRouter>
            <QueryClientProvider client={client}>
                {children}
                <AppOverlayManager />
            </QueryClientProvider>
        </BrowserRouter>
    );
};

export default Providers;
