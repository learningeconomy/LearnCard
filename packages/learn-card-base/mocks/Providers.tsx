import React from 'react';
import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const client = new QueryClient();

setupIonicReact({ swipeBackEnabled: false });

const Providers: React.FC = ({ children }) => {
    return (
        <IonApp>
            <IonReactRouter>
                <QueryClientProvider client={client}>{children}</QueryClientProvider>
            </IonReactRouter>
        </IonApp>
    );
};

export default Providers;
