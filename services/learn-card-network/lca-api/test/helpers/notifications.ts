import {
    LCNNotificationTypeEnumValidator,
    LCNNotificationTypeEnum,
    LCNNotification,
    LCNProfile,
} from '@learncard/types';

export const getTestNotification = (
    to: string | LCNProfile,
    from: string | LCNProfile,
    type: LCNNotificationTypeEnum = LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
    sent?: string
): LCNNotification => {
    let test = {
        to: typeof to === 'string' ? { did: to } : to,
        from: typeof from === 'string' ? { did: from } : from,
        type,
        ...(sent && { sent }),
    };

    return test;
};

export const addMinutesToDate = (date: Date, minutes: number): Date => {
    return new Date(date.getTime() + minutes * 60000);
};
