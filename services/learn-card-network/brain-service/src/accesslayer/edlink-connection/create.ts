import { EdlinkConnection, EdlinkConnectionInstance, EdlinkConnectionProps } from '@models';

export const createEdlinkConnection = async (
    data: EdlinkConnectionProps
): Promise<EdlinkConnectionInstance> => {
    return EdlinkConnection.createOne(data as any);
};
