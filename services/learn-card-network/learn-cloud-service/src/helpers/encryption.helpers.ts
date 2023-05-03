import { JWE } from '@learncard/types';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { isTest } from './test.helpers';

export const encryptObject = async (
    object: any,
    domain: string,
    recipients: string[] = []
): Promise<JWE> => {
    const learnCard = await getLearnCard();

    return learnCard.invoke
        .getDIDObject()
        .createDagJWE(object, [isTest ? learnCard.id.did() : `did:web:${domain}`, ...recipients]);
};
