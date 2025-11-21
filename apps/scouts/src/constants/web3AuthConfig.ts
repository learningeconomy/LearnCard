export const FIREBASE_REDIRECT_URL = 'pass.scout.org';

import { MAINNET_CLIENT_ID, MAINNET_NETWORK } from 'learn-card-base/constants/web3AuthConfig';

export const WEB3AUTH_NATIVE_CONFIG = {
    clientId: MAINNET_CLIENT_ID,
    network: MAINNET_NETWORK,

    verifierClientId: '792471921493-df6n0hb184opgghl84lujffto69bq8g9.apps.googleusercontent.com',
    verifierName: 'scoutPass-firebase-cyan-mainnet',
    verifierId: 'scoutPass-firebase-cyan-mainnet',
    verifierTypeOfLogin: 'jwt',

    whiteLabelName: 'ScoutPass',
    whiteLabelLogoLight: 'https://cdn.filestackcontent.com/P88NMOwcQQea8Hyqy57a',
    whiteLabelLogoDark: 'https://cdn.filestackcontent.com/P88NMOwcQQea8Hyqy57a',
    whiteLabelDark: false,
    whiteLabelPrimaryColor: '#622599',

    loginProvider: 'jwt',
    loginDomain: `https://${FIREBASE_REDIRECT_URL}`,

    loginVerifierIdField: 'sub',
    // loginIdToken: idToken,
};
