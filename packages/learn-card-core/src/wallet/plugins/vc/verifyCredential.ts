import { verifyCredential as vc } from '@src/didkit';

import { VC } from './types';

export const verifyCredential = async (credential: VC) => {
    return JSON.parse(await vc(JSON.stringify(credential), '{}'));
};
