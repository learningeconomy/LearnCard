import { VC, IDXCredential } from '@learncard/types';

export const persistenceMocks = () => {
    let credentials: IDXCredential[] = [];
    const uriMap: Record<string, VC> = {};

    const publishCredential = async (credential: VC) => {
        const uri = crypto.randomUUID();

        uriMap[uri] = credential;

        return uri;
    };

    const readFromCeramic = async (uri: string) => uriMap[uri];

    const resolveCredential = async (uri: string) => uriMap[uri];

    const addCredential = async (credential: IDXCredential) => {
        credentials.push(credential);
    };

    const getCredential = async (id: string) => {
        const credential = credentials.find(cred => cred.id === id);

        return resolveCredential(credential?.uri ?? '');
    };

    const getCredentials = async () =>
        Promise.all(credentials.map(credential => resolveCredential(credential.uri)));

    const getCredentialsList = async () => credentials;

    const removeCredential = async (id: string) => {
        credentials = credentials.filter(credential => credential.id !== id);
    };

    return {
        publishCredential,
        readFromCeramic,
        addCredential,
        getCredential,
        getCredentials,
        getCredentialsList,
        removeCredential,
        resolveCredential,
    };
};
