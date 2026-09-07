import { LCNNotificationValidator } from '@learncard/types';

import { acknowledgeConnectionPromptNotificationDelivery } from '@helpers/connectionPrompt.helpers';
import { sendNotification } from '@helpers/notifications.helpers';

export const deliverQueuedNotification = async (body: string): Promise<void> => {
    const notification = await LCNNotificationValidator.parseAsync(JSON.parse(body));

    const stored = await sendNotification(notification, {
        propagateDirectWebhookTransportErrors: true,
    });

    if (!stored) throw new Error('Notification was not durably stored');

    const connectionPrompt = notification.data?.metadata?.connectionPrompt;
    if (!connectionPrompt) return;

    const viewerProfileId = notification.to.profileId;
    if (!viewerProfileId) {
        throw new Error('Actionable notification is missing its recipient profile id');
    }

    await acknowledgeConnectionPromptNotificationDelivery(
        viewerProfileId,
        connectionPrompt.promptId
    );
};
