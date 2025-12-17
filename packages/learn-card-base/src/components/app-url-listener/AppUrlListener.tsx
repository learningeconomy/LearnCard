import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';

export const AppUrlListener: React.FC = () => {
    const history = useHistory();
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
                    history.push(event.url.replace(deepLinkDomain, ''));
                }
            });
            // If no match, do nothing - let regular routing
        });
    }, []);

    return null;
};

export default AppUrlListener;
