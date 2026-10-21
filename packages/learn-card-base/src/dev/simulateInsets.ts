import { isProductionEnvironment } from '../config/isProduction';

// Dev-only: simulate device safe-area insets in any desktop browser so band
// bugs are visible without a device. Activate with ?insets (47/34 defaults)
// or ?insets=20,10. Persists for the tab session. No-op in production builds.
export const installInsetSimulator = (): void => {
    if (isProductionEnvironment()) return;

    const params = new URLSearchParams(window.location.search);
    const raw = params.get('insets') ?? sessionStorage.getItem('lc-sim-insets');
    if (raw === null) return;

    // `?insets` with no value yields `raw === ''`; destructuring defaults only
    // kick in on `undefined`, so normalize the bare flag to the defaults here.
    const value = raw === '' ? '47,34' : raw;
    sessionStorage.setItem('lc-sim-insets', value);

    const [top = '47', bottom = '34'] = value.split(',');

    const root = document.documentElement;
    // Feed the SAME variables SystemBars would publish, so every downstream
    // consumer (--lc-safe-*, --ion-safe-area-*) picks them up unmodified.
    root.style.setProperty('--safe-area-inset-top', `${parseInt(top, 10) || 0}px`);
    root.style.setProperty('--safe-area-inset-bottom', `${parseInt(bottom, 10) || 0}px`);
    console.info(`[lc-dev] simulating safe-area insets: top=${top}px bottom=${bottom}px`);
};
