import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export const TOS_LINK = 'https://www.scout.org/additional-terms-user-accounts';
export const PP_LINK = 'https://www.scout.org/privacy';
export const CONTACT_LINK = 'https://support.scout.org/hc/en-gb';
export const MV_TYPEFORM = 'https://r18y4ggjlxv.typeform.com/to/fBWigxQx'; // Request Metaversity at Your School
export const LEARNCARD_WEBSITE = 'https://scout.org/scoutpass';

export const openExternalLink = async (url: string) => {
    if (Capacitor?.isNativePlatform()) {
        await Browser?.open({ url });
    } else {
        window?.open(url);
    }
};

export const openLCwebsite = async () => {
    if (Capacitor?.isNativePlatform()) {
        await Browser?.open({ url: LEARNCARD_WEBSITE });
    } else {
        window?.open(LEARNCARD_WEBSITE);
    }
};

export const openToS = async () => {
    if (Capacitor?.isNativePlatform()) {
        await Browser?.open({ url: TOS_LINK });
    } else {
        window?.open(TOS_LINK);
    }
};

export const openPP = async () => {
    if (Capacitor.isNativePlatform()) {
        await Browser?.open({ url: PP_LINK });
    } else {
        window?.open(PP_LINK);
    }
};

export const openContactLink = async () => {
    if (Capacitor.isNativePlatform()) {
        await Browser?.open({ url: CONTACT_LINK });
    } else {
        window?.open(CONTACT_LINK);
    }
};
