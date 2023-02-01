/** Generates a did:web for a user given the domain of the app */
export const getDidWeb = (domain: string, handle: string): string => `did:web:${domain}:${handle}`;
