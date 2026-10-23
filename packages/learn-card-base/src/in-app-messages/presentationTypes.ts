import type { InAppMessage, InAppMessageActionTarget } from '@learncard/types';

export interface InAppMessagePresentationEvent {
    type: 'shown' | 'action' | 'dismissed';
    messageId: string;
    presentation: InAppMessage['presentation'];
    source: 'flag' | 'deepLink' | 'override';
    actionIndex?: number;
    actionSource?: 'step' | 'message';
    actionType?: InAppMessageActionTarget['type'];
    stepIndex?: number;
}

export interface MessageInteraction {
    actionIndex?: number;
    actionSource?: 'step' | 'message';
    actionType?: InAppMessageActionTarget['type'];
    stepIndex?: number;
}

export interface MessagePresentationProps {
    message: InAppMessage;
    onClose: (reason?: 'dismissed' | 'action' | 'expired', details?: MessageInteraction) => void;
    onAction?: (details: MessageInteraction) => void;
}
