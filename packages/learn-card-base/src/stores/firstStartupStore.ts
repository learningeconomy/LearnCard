import { createStore } from '@udecode/zustood';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

const firstStartupStore = createStore('firstStartup')<{
    firstStart: boolean;
    introSlidesCompleted: boolean;
    version: string;
    dashboardGetStartedDismissed: boolean;
}>(
    {
        firstStart: true,
        introSlidesCompleted: false,
        version: '',
        dashboardGetStartedDismissed: false,
    },
    { persist: { name: 'firstStartup', enabled: true } }
);

export default firstStartupStore;

export const useFirstStart = firstStartupStore.useTracked.firstStart;
export const useIntroSlidesCompleted = firstStartupStore.useTracked.introSlidesCompleted;
