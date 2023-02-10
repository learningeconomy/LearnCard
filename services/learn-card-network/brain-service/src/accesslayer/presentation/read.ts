import { Presentation, PresentationInstance } from '@models';

export const getPresentationById = async (id: string): Promise<PresentationInstance | null> => {
    return Presentation.findOne({ where: { id } });
};
