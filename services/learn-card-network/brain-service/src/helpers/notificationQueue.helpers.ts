import { authorizeContractNotification } from '@helpers/contract-events.helpers';
import { ConsentFlowWebhookMetadataValidator, LCNNotificationValidator } from '@learncard/types';

import { acknowledgeConnectionPromptNotificationDelivery } from '@helpers/connectionPrompt.helpers';
import {
    PermanentNotificationDeliveryError,
    sendNotification,
} from '@helpers/notifications.helpers';

export const deliverQueuedNotification = async (body: string): Promise<void> => {
    const notification = await LCNNotificationValidator.parseAsync(JSON.parse(body));

    if (!(await authorizeContractNotification(notification))) return;

    const isContractEvent = ConsentFlowWebhookMetadataValidator.safeParse(
        notification.data?.metadata
    ).success;
    let stored: boolean | undefined;
    try {
        stored = await sendNotification(notification, {
            propagateDirectWebhookTransportErrors: true,
            throwOnPermanentFailure: isContractEvent,
        });
    } catch (error) {
        // Acknowledge terminal contract rejections so SQS can discard its payload too.
        // Other notification types keep their existing worker behavior.
        if (isContractEvent && error instanceof PermanentNotificationDeliveryError) return;
        throw error;
    }

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
