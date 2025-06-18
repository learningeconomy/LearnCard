import type { JWE } from '@learncard/types';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { isTest } from './test.helpers';

export const encryptObject = async (
    object: any,
    domain: string,
    recipients: string[] = []
): Promise<JWE> => {
    const learnCard = await getLearnCard();

    return learnCard.invoke.createDagJwe(object, [
        isTest ? learnCard.id.did() : `did:web:${domain}`,
        ...recipients,
    ]);
};

export const decryptObject = async <Output extends Record<string, any>>(
    jwe: JWE
): Promise<Output> => {
    const learnCard = await getLearnCard();

    return learnCard.invoke.decryptDagJwe(jwe, [learnCard.id.keypair()]);
};
