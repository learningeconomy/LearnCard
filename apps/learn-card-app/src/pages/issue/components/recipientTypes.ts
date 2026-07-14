export type RecipientMode = 'self' | 'people' | 'link';

export type Recipient =
    | { kind: 'profile'; profileId: string; displayName: string; image?: string; did?: string }
    | { kind: 'email'; email: string };

export interface LinkOptions {
    expiresAt?: string;
    maxClaims?: number;
}

export const isEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const recipientKey = (recipient: Recipient): string =>
    recipient.kind === 'profile' ? recipient.profileId : recipient.email;

export const recipientLabel = (recipient: Recipient): string =>
    recipient.kind === 'profile' ? recipient.displayName : recipient.email;

export const prettifyEmailName = (email: string): string => {
    const local = email.split('@')[0]?.split('+')[0] ?? '';
    const words = local.replace(/[._-]+/g, ' ').trim();
    if (!words) return email;
    return words.replace(/\b\w/g, char => char.toUpperCase());
};

export const recipientDisplayName = (recipient: Recipient): string =>
    recipient.kind === 'profile' ? recipient.displayName : prettifyEmailName(recipient.email);

export const summarizeRecipients = (recipients: Recipient[]): string => {
    const names = recipients.map(recipientDisplayName).filter(Boolean);
    if (names.length === 0) return 'the recipient';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names[0]}, ${names[1]} and ${names.length - 2} others`;
};
