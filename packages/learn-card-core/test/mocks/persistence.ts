import { VC } from '@learncard/types';

import { IDXCredential } from '../../src/wallet/plugins/idx/types';

export const persistenceMocks = () => {
    let credentials: IDXCredential[] = [];
    const streamIdMap: Record<string, VC> = {};

    const publishCredential = async (credential: VC) => {
        const id = crypto.randomUUID();

        streamIdMap[id] = credential;

        return id;
    };

    const readFromCeramic = async (id: string) => streamIdMap[id];

    const addCredential = async (credential: IDXCredential) => {
        credentials.push(credential);
    };

    const getCredential = async (title: string) => {
        const credential = credentials.find(cred => cred.title === title);

        return readFromCeramic(credential.id);
    };

    const getCredentials = async () =>
        Promise.all(credentials.map(credential => readFromCeramic(credential.id)));

    const getCredentialsList = async () => credentials;

    const removeCredential = async (title: string) => {
        credentials = credentials.filter(credential => credential.title !== title);
    };

    return {
        publishCredential,
        readFromCeramic,
        addCredential,
        getCredential,
        getCredentials,
        getCredentialsList,
        removeCredential,
    };
};
