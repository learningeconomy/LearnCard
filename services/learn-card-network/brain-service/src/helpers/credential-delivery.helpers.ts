import { logCredentialSent } from './activity.helpers';
import { sendBoost } from './boost.helpers';

/**
 * Finish activity relationships before delivery writes to the same issuer/listing.
 * Running both operations concurrently can deadlock Neo4j and report failure after
 * the credential has already been delivered.
 */
export const sendBoostWithActivity = async (
    activity: Parameters<typeof logCredentialSent>[0],
    delivery: Omit<Parameters<typeof sendBoost>[0], 'activityId'>
): Promise<string> => {
    const activityId = await logCredentialSent(activity);

    return sendBoost({ ...delivery, activityId });
};
