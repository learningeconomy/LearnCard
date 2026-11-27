import React, { useState, useEffect, useMemo } from 'react';
import Typewriter from 'typewriter-effect';
import { shuffle } from 'lodash-es';

import * as m from '../../../paraglide/messages.js';
import { useLocale } from '../../../i18n';

import { AppRow } from '../../../components/layout';
import { useTenantBrandingAssets } from '../../../config/brandingAssets';

import themeStore from '../../../theme/store/themeStore';
import { getThemeLoaderColors, resolveThemeId } from '../../../theme/helpers/themeIds';
import { AppContent, AppPage } from '../../../components/chrome';

export const LoginLoadingPage: React.FC = () => {
    const locale = useLocale();

    const messages = useMemo(
        () =>
            shuffle([
                m['login.loader.messages.0'](),
                m['login.loader.messages.1'](),
                m['login.loader.messages.2'](),
                m['login.loader.messages.3'](),
                m['login.loader.messages.4'](),
                m['login.loader.messages.5'](),
                m['login.loader.messages.6'](),
                m['login.loader.messages.7'](),
                m['login.loader.messages.8'](),
                m['login.loader.messages.9'](),
                // eslint-disable-next-line react-hooks/exhaustive-deps -- Paraglide messages are static at runtime; shuffle on mount only
            ]),
        [locale]
    );
    const { textLogo } = useTenantBrandingAssets();
    // Rendered before FullApp loads (App's Suspense fallback), so read the loader colors from the theme
    // JSON instead of useTheme(), which would pull every theme's icon set into the entry.
    const loaders = getThemeLoaderColors(resolveThemeId(themeStore.use.theme()));
    const [currentColorIndex, setCurrentColorIndex] = useState(0);
    const colors = useMemo(() => [...loaders], [loaders]);
    const interval = 5200;

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentColorIndex(prevIndex => (prevIndex + 1) % colors.length);
        }, interval);

        return () => clearInterval(timer);
    }, [colors, interval]);

    return (
        <AppPage>
            <AppContent fullscreen className="flex items-center justify-center">
                <AppRow
                    className="h-full w-full transition-colors duration-1000 ease-in-out flex items-center justify-center text-white text-2xl"
                    style={{ backgroundColor: colors[currentColorIndex] }}
                >
                    <div className="flex flex-col items-center justify-center">
                        <img
                            src={textLogo}
                            alt="Logo"
                            className="mb-8 max-w-[300px] max-h-[80px] object-contain"
                        />
                        <div className="w-full flex items-center justify-center text-center px-6">
                            <Typewriter
                                options={{
                                    strings: messages,
                                    autoStart: true,
                                    loop: true,
                                    delay: 70,
                                    deleteSpeed: 50,
                                }}
                            />
                        </div>
                    </div>
                </AppRow>
            </AppContent>
        </AppPage>
    );
};

export default LoginLoadingPage;
