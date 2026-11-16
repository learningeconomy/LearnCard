/**
 * The platform's WebCrypto implementation.
 *
 * Node.js 20+ and every current browser provide `globalThis.crypto`. Environments that do not
 * (React Native, older Node) must install a WebCrypto polyfill before using LearnCard; this
 * package no longer bundles one, because it made every consumer install React Native tooling.
 * Browsers can expose getRandomValues without subtle in insecure contexts. Preserve that
 * object for random-byte callers; SubtleCrypto operations still need HTTPS or localhost.
 */
export const getCrypto = (): Crypto => {
    const webCrypto = globalThis.crypto;

    if (typeof webCrypto?.getRandomValues !== 'function') {
        throw new Error(
            'WebCrypto is not available: globalThis.crypto.getRandomValues is missing. Use Node.js 20 or ' +
                'newer, or load a WebCrypto polyfill before initializing LearnCard (on React ' +
                'Native, for example react-native-get-random-values plus a SubtleCrypto polyfill).'
        );
    }

    return webCrypto;
};
