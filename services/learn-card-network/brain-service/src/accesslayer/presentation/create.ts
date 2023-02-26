import { VP, JWE } from '@learncard/types';
import { v4 as uuid } from 'uuid';

import { Presentation, PresentationInstance } from '@models';

export const storePresentation = async (presentation: VP | JWE): Promise<PresentationInstance> => {
    const id = uuid();

    return Presentation.createOne({ id, presentation: JSON.stringify(presentation) });
};
