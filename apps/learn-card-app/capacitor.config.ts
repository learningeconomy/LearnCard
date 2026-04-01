/**
 * Default Capacitor config — used as the source for `npx cap sync`.
 *
 * **Workflow order for tenant builds (enforced by `pnpm lc native`):**
 *   1. `prepare-native-config.ts <tenant>` — populates public/ with tenant config + assets
 *   2. `vite build`                        — compiles web app with correct tenant data
 *   3. `npx cap sync`                      — copies fresh build/ into native projects
 *   4. `prepare-native-config.ts <tenant>` — re-patches native files that cap sync
 *                                             overwrites (capacitor.config.json, etc.)
 *
 * ⚠️  All four steps are needed. Step 2 ensures the JS bundle includes the
 *     correct tenant config. Step 4 re-patches capacitor.config.json because
 *     cap sync regenerates it from these LearnCard defaults.
 *
 * The values below are LearnCard defaults. For tenant-specific overrides, see:
 *   environments/<tenant>/assets/config/capacitor.config.json
 */
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.learncard.app',
    appName: 'LearnCard',
    webDir: 'build',
    bundledWebRuntime: false,
    android: {
        adjustMarginsForEdgeToEdge: 'force',
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 6000,
            launchAutoHide: true,
            backgroundColor: '#00BA88',
            showSpinner: false,
            spinnerColor: '#ffffff',
            splashFullScreen: false,
            splashImmersive: false,
            layoutName: 'launch_screen',
        },
        FirebaseAuthentication: {
            skipNativeAuth: false,
            providers: ['phone', 'apple.com', 'google.com'],
        },
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert'],
        },
        Badge: {
            persist: true,
            autoClear: false,
        },
        SafeArea: {
            enabled: true,
        },
        CapacitorUpdater: {
            appId: 'com.learncard.app',
            autoUpdate: true,
            defaultChannel: '1.0.5', // bumped here -> https://github.com/learningeconomy/LearnCard/pull/1063
        },
    },
};

export default config;
