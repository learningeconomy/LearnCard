import type { CurrentUser } from 'learn-card-base/stores/currentUserStore';

export const contractAnonImageSrc = 'https://cdn.filestackcontent.com/52hRlXLIQVBi4fYpB1xw';

export const getPersonalEntry = (key: string, user?: CurrentUser | null, anonymize = true) => {
    if (key.toLowerCase() === 'name') return anonymize ? 'Anonymous' : (user?.name ?? '');
    if (key.toLowerCase() === 'email') {
        return anonymize ? 'anonymous@hidden.com' : (user?.email ?? '');
    }
    if (key.toLowerCase() === 'image') {
        return anonymize ? contractAnonImageSrc : (user?.profileImage ?? '');
    }

    return '';
};

export const isSupportedPersonalField = (field: string) => {
    const lowerField = field.toLowerCase();
    return ['name', 'email', 'image'].includes(lowerField);
};
