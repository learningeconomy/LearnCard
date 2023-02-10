import { VP } from '@learncard/types';
import { v4 as uuid } from 'uuid';

import { Presentation, PresentationInstance } from '@models';

/** Stores a Credential */
export const storePresentation = async (presentation: VP): Promise<PresentationInstance> => {
    const id = uuid();

    return Presentation.createOne({ id, presentation: JSON.stringify(presentation) });
};
