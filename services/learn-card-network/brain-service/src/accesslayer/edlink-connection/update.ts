import { QueryBuilder, BindParam } from 'neogma';
import { EdlinkConnection, EdlinkConnectionInstance } from '@models';

/**
 * Update the auto-issue setting for a connection.
 */
export const updateEdlinkConnectionAutoIssue = async (
    id: string,
    autoIssueCredentials: boolean
): Promise<EdlinkConnectionInstance | null> => {
    await new QueryBuilder(new BindParam({ params: { autoIssueCredentials } }))
        .match({ model: EdlinkConnection, where: { id }, identifier: 'conn' })
        .set('conn += $params')
        .run();

    return EdlinkConnection.findOne({ where: { id } });
};

/**
 * Update the last polled timestamp for a connection.
 */
export const updateEdlinkConnectionLastPolled = async (
    id: string,
    lastPolledAt: string
): Promise<EdlinkConnectionInstance | null> => {
    await new QueryBuilder(new BindParam({ params: { lastPolledAt } }))
        .match({ model: EdlinkConnection, where: { id }, identifier: 'conn' })
        .set('conn += $params')
        .run();

    return EdlinkConnection.findOne({ where: { id } });
};

/**
 * Update the owner profile ID for a connection.
 */
export const updateEdlinkConnectionOwner = async (
    id: string,
    ownerProfileId: string
): Promise<EdlinkConnectionInstance | null> => {
    await new QueryBuilder(new BindParam({ params: { ownerProfileId } }))
        .match({ model: EdlinkConnection, where: { id }, identifier: 'conn' })
        .set('conn += $params')
        .run();

    return EdlinkConnection.findOne({ where: { id } });
};
