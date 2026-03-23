/**
 * Default Capacitor config — used as the source for `npx cap sync`.
 *
 * **Workflow order for tenant builds:**
 *   1. `npx cap sync`              — regenerates native project JSON from this file
 *   2. `npx tsx scripts/prepare-native-config.ts <tenant>`
 *                                   — overwrites the generated JSON with tenant values
 *                                     (appId, appName, CapacitorUpdater, splash color, etc.)
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
