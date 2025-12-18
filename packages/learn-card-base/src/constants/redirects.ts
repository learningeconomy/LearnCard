import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { SCOUTPASS_NETWORK_URL } from './Networks';
import { networkStore } from 'learn-card-base/stores/NetworkStore';

export const LOGIN_REDIRECTS: {
    [key: string]: {
        redirectUrl: string;
        devRedirectUrl: string;
    };
} = {
    [BrandingEnum.learncard]: {
        redirectUrl: 'https://learncard.app/waitingsofa?loginCompleted=true',
        devRedirectUrl: 'http://localhost:3000/waitingsofa?loginCompleted=true',
    },
    [BrandingEnum.metaversity]: {
        redirectUrl: 'https://m.learncard.app?loginCompleted=true',
        devRedirectUrl: 'https://localhost:3000/waitingsofa?loginCompleted=true',
    },
    [BrandingEnum.scoutPass]: {
        redirectUrl: 'https://pass.scout.org/waitingsofa?loginCompleted=true',
        devRedirectUrl: 'https://localhost:3000/waitingsofa?loginCompleted=true',
    },
    [BrandingEnum['Daily Wizard Dev']]: {
        redirectUrl: 'https://app.dailywizard.ai/waitingsofa?loginCompleted=true',
        devRedirectUrl: 'https://localhost:3000/waitingsofa?loginCompleted=true',
    },
    [BrandingEnum['Bedtime Tales Dev']]: {
        redirectUrl: 'https://app.bedtimetales.ai/waitingsofa?loginCompleted=true',
        devRedirectUrl: 'https://localhost:3000/waitingsofa?loginCompleted=true',
    },
    [BrandingEnum['Dev Test App']]: {
        redirectUrl: 'https://app.plaidlibs.ai/waitingsofa?loginCompleted=true',
        devRedirectUrl: 'https://localhost:3000/waitingsofa?loginCompleted=true',
    },
    [BrandingEnum['OmWriter']]: {
        redirectUrl: 'https://app.plaidlibs.ai/waitingsofa?loginCompleted=true',
        devRedirectUrl: 'https://localhost:3000/waitingsofa?loginCompleted=true',
    },
};

export const SCOUTPASS_BASE_URL = 'pass.scout.org';
export const LEARNCARD_BASE_URL = 'learncard.app';

export const getBaseUrl = (): string => {
    if (process.env.NODE_ENV === 'production') {
        const network = networkStore?.get?.networkUrl();
        if (!network)
            return LEARNCARD_BASE_URL; // default network to learncard.app if no network is set
        else if (network && network === SCOUTPASS_NETWORK_URL) return SCOUTPASS_BASE_URL;
        else return LEARNCARD_BASE_URL;
    }

    return 'localhost:3000';
};
