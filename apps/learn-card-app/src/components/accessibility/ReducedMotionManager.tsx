import React, { useEffect } from 'react';

type IonicSpinnerElement = HTMLElement & {
    paused: boolean;
};

/**
 * Pauses Ionic's shadow-DOM spinner animations when reduced motion is enabled.
 * Light-DOM animation and transition overrides live in index.scss.
 */
const ReducedMotionManager: React.FC = () => {
    useEffect(() => {
        const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        if (!mediaQuery) return undefined;

        const updateSpinners = (): void => {
            document.querySelectorAll<IonicSpinnerElement>('ion-spinner').forEach(spinner => {
                spinner.paused = mediaQuery.matches;
            });
        };

        updateSpinners();

        const observer = new MutationObserver(updateSpinners);
        observer.observe(document.body, { childList: true, subtree: true });
        mediaQuery.addEventListener('change', updateSpinners);

        return () => {
            observer.disconnect();
            mediaQuery.removeEventListener('change', updateSpinners);
        };
    }, []);

    return null;
};

export default ReducedMotionManager;
