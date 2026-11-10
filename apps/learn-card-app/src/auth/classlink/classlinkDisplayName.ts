// The callback uses client-side navigation to onboarding, so memory is sufficient.
// Reloads intentionally discard the prefill rather than persisting a person's name.
let displayName = '';

export const setClassLinkDisplayName = (value?: string): void => {
    displayName = value?.trim().slice(0, 200) || '';
};

export const getClassLinkDisplayName = (): string => displayName;

export const clearClassLinkDisplayName = (): void => {
    displayName = '';
};
