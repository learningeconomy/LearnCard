export const FIREBASE_REDIRECT_URL = 'learncard.app';

export const WEB3AUTH_NATIVE_CONFIG = {
    clientId:
        'BBB5ReobO60-olXYx2JB7s5pkJplYnBHz4E99Cdf9aaNokNt3XzvVvRL9UQfziK_PMEuBYcgdMEW_WCHNPdUGPg',
    network: 'testnet',

    verifierClientId: '776298253175-kkf562eofl541vu0oedfdvrk40bpkbh7.apps.googleusercontent.com',
    verifierName: 'learncardapp-firebase',
    verifierId: 'learncardapp-firebase',
    verifierTypeOfLogin: 'jwt',

    whiteLabelName: 'LearnCard',
    whiteLabelLogoLight:
        'https://cdn.filestackcontent.com/rotate=deg:exif/auto_image/tRrHF9W2Q9ugaiIAAJI8',
    whiteLabelLogoDark:
        'https://cdn.filestackcontent.com/rotate=deg:exif/auto_image/tRrHF9W2Q9ugaiIAAJI8',
    whiteLabelDark: false,
    whiteLabelPrimaryColor: '#20c397',

    loginProvider: 'jwt',
    loginDomain: `https://${FIREBASE_REDIRECT_URL}`,

    loginVerifierIdField: 'sub',
    // loginIdToken: idToken,
};
