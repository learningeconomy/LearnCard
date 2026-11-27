import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { App, URLOpenListenerEvent } from '@capacitor/app';

export const AppUrlListener: React.FC = () => {
    const navigate = useNavigate();
    const deepLinkDomains = [
        'https://learncard.app',
        'https://learncardapp.netlify.app',
        'https://learncardapp.netlify.com',
    ];
    useEffect(() => {
        App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
            // Example url: https://app.welibrary.io/g/123ABC => should route internally to /g/123ABC
            deepLinkDomains.forEach(deepLinkDomain => {
                if (event.url.includes(deepLinkDomain)) {
                    navigate(event.url.replace(deepLinkDomain, ''));
                }
            });
            // If no match, do nothing - let regular routing
        });
    }, []);

    return null;
};

export default AppUrlListener;
