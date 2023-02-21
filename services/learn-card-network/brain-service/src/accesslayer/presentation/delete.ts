import { PresentationInstance } from '@models';

export const deletePresentation = async (presentation: PresentationInstance): Promise<void> => {
    await presentation.delete({ detach: true });
};
