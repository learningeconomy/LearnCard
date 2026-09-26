import { setupIonicReact } from '@ionic/react';
import '@ionic/react/css/core.css';
import '@ionic/react/css/structure.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route } from 'react-router-dom';
import ShareLinkCreate from '../../src/components/share-links/ShareLinkCreate';
import ShareLinkViewer from '../../src/components/share-links/ShareLinkViewer';
import { setLocale } from '../../src/paraglide/runtime.js';
import './style.css';
const locale = new URLSearchParams(location.search).get('locale');
if (locale === 'ar' || locale === 'en' || locale === 'es' || locale === 'fr') {
    setLocale(locale, { reload: false });
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
}
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
