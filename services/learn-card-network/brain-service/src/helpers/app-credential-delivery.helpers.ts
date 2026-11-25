import { logCredentialSent } from './activity.helpers';
import { sendBoost } from './boost.helpers';

/** Complete activity graph writes before delivery writes touch the same listing. */
export const sendAppCredentialWithActivity = async (
    activity: Parameters<typeof logCredentialSent>[0],
    delivery: Omit<Parameters<typeof sendBoost>[0], 'activityId'>
): Promise<string> => {
    const activityId = await logCredentialSent(activity);
    return sendBoost({ ...delivery, activityId });
};
