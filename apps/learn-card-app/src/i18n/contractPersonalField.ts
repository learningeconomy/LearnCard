import * as m from '../paraglide/messages.js';

/** English personal-field label → Paraglide message key. */
const PERSONAL_FIELD_KEY: Record<string, string> = {
    name: 'consentFlow.personalField.name',
    email: 'consentFlow.personalField.email',
    'profile picture': 'consentFlow.personalField.profilePicture',
    image: 'consentFlow.personalField.profilePicture',
};

export const localizeContractPersonalField = (field: string): string => {
    const fn = (m as Record<string, unknown>)[PERSONAL_FIELD_KEY[field.toLowerCase()]];
    return typeof fn === 'function' ? (fn as () => string)() : field;
};
