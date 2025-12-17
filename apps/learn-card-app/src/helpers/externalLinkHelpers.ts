import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export const TOS_LINK = 'https://www.learncard.com/learncard-terms-of-service';
export const PP_LINK = 'https://www.learncard.com/learncard-privacy-policy';
export const CONTACT_LINK = 'https://www.learningeconomy.io/contact';
export const MV_TYPEFORM = 'https://r18y4ggjlxv.typeform.com/to/fBWigxQx'; // Request Metaversity at Your School
export const LEARNCARD_WEBSITE = 'https://www.learncard.com/';
export const DEVELOPER_DOCS = 'https://docs.learncard.com/';

export const openExternalLink = async (url: string) => {
    if (Capacitor?.isNativePlatform()) {
        await Browser?.open({ url });
    } else {
        window?.open(url, '_blank', 'noopener,noreferrer');
    }
};

export const openLCwebsite = async () => {
    if (Capacitor?.isNativePlatform()) {
        await Browser?.open({ url: LEARNCARD_WEBSITE });
    } else {
        window?.open(LEARNCARD_WEBSITE, '_blank', 'noopener,noreferrer');
    }
};

export const openToS = async () => {
    if (Capacitor?.isNativePlatform()) {
        await Browser?.open({ url: TOS_LINK });
    } else {
        window?.open(TOS_LINK, '_blank', 'noopener,noreferrer');
    }
};

export const openPP = async () => {
    if (Capacitor.isNativePlatform()) {
        await Browser?.open({ url: PP_LINK });
    } else {
        window?.open(PP_LINK, '_blank', 'noopener,noreferrer');
    }
};

export const openContactLink = async () => {
    if (Capacitor.isNativePlatform()) {
        await Browser?.open({ url: CONTACT_LINK });
    } else {
        window?.open(CONTACT_LINK, '_blank', 'noopener,noreferrer');
    }
};

export const openDeveloperDocs = async () => {
    if (Capacitor.isNativePlatform()) {
        await Browser?.open({ url: DEVELOPER_DOCS });
    } else {
        window?.open(DEVELOPER_DOCS, '_blank', 'noopener,noreferrer');
    }
};
