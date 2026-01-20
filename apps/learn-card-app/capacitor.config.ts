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
            defaultChannel: '1.0.3', // bumped here -> https://github.com/learningeconomy/LearnCard/pull/938
        },
    },
};

export default config;
