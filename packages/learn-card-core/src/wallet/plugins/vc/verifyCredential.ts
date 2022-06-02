import { verifyCredential as vc } from '@src/didkit/index';

import { VC } from './types';

export const verifyCredential = async (credential: VC) => {
    return JSON.parse(await vc(JSON.stringify(credential), '{}'));
};
