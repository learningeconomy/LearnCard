import type { CapacitorConfig } from '@capacitor/cli';
import { nativeBrowserCompatibility } from '../../packages/learn-card-base/src/config/nativeBrowserCompatibility';

const config: CapacitorConfig = {
    appId: 'org.scoutpass.app',
    appName: 'ScoutPass',
    webDir: 'build',
    bundledWebRuntime: false,
    ...nativeBrowserCompatibility({ android: { adjustMarginsForEdgeToEdge: 'force' } }),
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
            appId: 'org.scoutpass.app',
            autoUpdate: true,
            defaultChannel: '1.0.8', // LC-2006: Tailwind 4 requires an iOS 16.4+ native build.
        },
    },
};

export default config;
