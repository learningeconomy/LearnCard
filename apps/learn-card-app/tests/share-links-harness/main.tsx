import { setupIonicReact } from '@ionic/react';
import '@ionic/react/css/core.css';
import '@ionic/react/css/structure.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route } from 'react-router-dom';
import ShareLinkCreate from '../../src/components/share-links/ShareLinkCreate';
import ShareLinkViewer from '../../src/components/share-links/ShareLinkViewer';
import './style.css';
setupIonicReact();
createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        {location.pathname.startsWith('/s/') ? (
            <Route path="/s/:id" component={ShareLinkViewer} />
        ) : (
            <ShareLinkCreate onDismiss={() => {}} />
        )}
    </BrowserRouter>
);
