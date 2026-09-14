import { createStore } from '@udecode/zustood';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

export const RECOVERY_PROMPT_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

const LEGACY_RECOVERY_PROMPT_DISMISSED_KEY = 'lc_recovery_banner_dismissed';

const firstStartupStore = createStore('firstStartup')<{
    firstStart: boolean;
    introSlidesCompleted: boolean;
    version: string;
    dashboardGetStartedDismissed: boolean;
    recoveryPromptSnoozedUntil: number;
}>(
    {
        firstStart: true,
        introSlidesCompleted: false,
        version: '',
        dashboardGetStartedDismissed: false,
        recoveryPromptSnoozedUntil: 0,
    },
    { persist: { name: 'firstStartup', enabled: true } }
);

// Migrate the old permanent dismissal synchronously so the prompt cannot flash
// before React effects run. The guard keeps this shared store safe in SSR/tests.
if (typeof window !== 'undefined') {
    try {
        if (window.localStorage.getItem(LEGACY_RECOVERY_PROMPT_DISMISSED_KEY) === 'true') {
            firstStartupStore.set.recoveryPromptSnoozedUntil(
                Date.now() + RECOVERY_PROMPT_SNOOZE_MS
            );
            window.localStorage.removeItem(LEGACY_RECOVERY_PROMPT_DISMISSED_KEY);
        }
    } catch {
        // Storage can be unavailable in privacy-restricted browser contexts.
    }
}

export default firstStartupStore;

export const useFirstStart = firstStartupStore.useTracked.firstStart;
export const useIntroSlidesCompleted = firstStartupStore.useTracked.introSlidesCompleted;
