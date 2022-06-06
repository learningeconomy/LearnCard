import { verifyPresentation as vp } from 'didkit';
import { VP } from '@learncard/types';

export const verifyPresentation = async (presentation: VP) => {
    return JSON.parse(await vp(JSON.stringify(presentation), '{}'));
};
