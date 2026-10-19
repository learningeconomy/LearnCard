import type { InAppMessage, InAppMessageActionTarget } from '@learncard/types';

export interface InAppMessagePresentationEvent {
    type: 'shown' | 'action' | 'dismissed';
    messageId: string;
    presentation: InAppMessage['presentation'];
    source: 'flag' | 'deepLink' | 'override';
    actionIndex?: number;
    actionType?: InAppMessageActionTarget['type'];
    stepIndex?: number;
}

export interface MessageInteraction {
    actionIndex?: number;
    actionType?: InAppMessageActionTarget['type'];
    stepIndex?: number;
}

export interface MessagePresentationProps {
    message: InAppMessage;
    onClose: (reason?: 'dismissed' | 'action', details?: MessageInteraction) => void;
    onAction?: (details: MessageInteraction) => void;
}
