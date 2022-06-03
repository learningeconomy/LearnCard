import { verifyCredential as vc } from 'didkit';
import { VC } from 'learn-card-types';

export const verifyCredential = async (credential: VC) => {
    return JSON.parse(await vc(JSON.stringify(credential), '{}'));
};
