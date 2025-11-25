import { FirebaseAnalytics } from '@capacitor-firebase/analytics';

export const useFirebaseAnalytics = () => {
    const setUserId = async (userDid: string) => {
        await FirebaseAnalytics.setUserId({
            userId: userDid,
        });
    };

    const setCurrentScreen = async (activeScreen: string) => {
        await FirebaseAnalytics.setCurrentScreen({
            screenName: activeScreen,
            screenClassOverride: activeScreen,
        });

        await setEnableAnalytics();
    };

    const logAnalyticsEvent = async (name: string, params: any) => {
        try {
            await FirebaseAnalytics.logEvent({
                name,
                params,
            });
        } catch (error) {
            console.log('logAnalyticsEvent::error', error);
        }
    };

    const setEnableAnalytics = async () => {
        await FirebaseAnalytics.setEnabled({
            enabled: true,
        });
    };

    return {
        setUserId,
        setEnableAnalytics,
        setCurrentScreen,
        logAnalyticsEvent,
    };
};

export default useFirebaseAnalytics;
