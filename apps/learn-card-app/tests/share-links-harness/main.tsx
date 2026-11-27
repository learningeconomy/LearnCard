import { initAppPlatform } from 'learn-card-base/ui/app-shell/appPlatform';
import 'learn-card-base/ui/global/core.css';
import 'learn-card-base/ui/global/structure.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route } from 'react-router';
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
initAppPlatform();
createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        {location.pathname.startsWith('/s/') ? (
            <Route path="/s/:id" component={ShareLinkViewer} />
        ) : (
            <ShareLinkCreate onDismiss={() => {}} />
        )}
    </BrowserRouter>
);
