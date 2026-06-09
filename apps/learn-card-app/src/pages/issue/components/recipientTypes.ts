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
