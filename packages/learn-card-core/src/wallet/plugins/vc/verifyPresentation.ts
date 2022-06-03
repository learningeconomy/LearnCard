import { verifyPresentation as vp } from 'didkit';
import { VP } from 'learn-card-types';

export const verifyPresentation = async (presentation: VP) => {
    return JSON.parse(await vp(JSON.stringify(presentation), '{}'));
};
