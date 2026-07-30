/** Generates a did:web for a user given the app domain and profile ID. */
export const getDidWeb = (domain: string, profileId: string): string => {
    let decodedDomain = domain;

    try {
        decodedDomain = decodeURIComponent(domain);
    } catch {
        // Keep the original domain when it is not valid URI-encoded input.
    }

    return `did:web:${encodeURIComponent(decodedDomain)}:users:${profileId}`;
};
