import { verifyPresentation as vp } from '@src/didkit';

import { VP } from './types';

export const verifyPresentation = async (presentation: VP) => {
    return JSON.parse(await vp(JSON.stringify(presentation), '{}'));
};
