import type { CapacitorConfig } from '@capacitor/cli';
import { nativeBrowserCompatibility } from '../../packages/learn-card-base/src/config/nativeBrowserCompatibility';

const config: CapacitorConfig = {
    appId: 'org.scoutpass.app',
    appName: 'ScoutPass',
    webDir: 'build',
    bundledWebRuntime: false,
    ...nativeBrowserCompatibility({ android: { adjustMarginsForEdgeToEdge: 'force' } }),
    plugins: {
        CapacitorSQLite: {
            iosIsEncryption: true,
            androidIsEncryption: true,
            iosKeychainPrefix: 'learncard.sqlite.v1',
        },
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
            appId: 'org.scoutpass.app',
            autoUpdate: true,
            defaultChannel: '1.0.9', // Native SQLite encryption requires a new binary; keep older OTA channels unchanged.
        },
    },
};

export default config;
