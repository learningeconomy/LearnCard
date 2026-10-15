/** Omitted image preserves the current photo; an explicit empty string removes it. */
export const nativeProfileUpdate = (input: { name: string; bio: string; image?: string }) => {
    if (
        typeof input.name !== 'string' ||
        !input.name.trim() ||
        input.name.length > 100 ||
        typeof input.bio !== 'string' ||
        input.bio.length > 500
    )
        throw new Error('Invalid profile');
    if (input.image !== undefined && input.image !== '') {
        if (typeof input.image !== 'string' || input.image.length > 2048)
            throw new Error('Invalid photo');
        const url = new URL(input.image);
        if (
            url.protocol !== 'https:' ||
            url.hostname !== 'cdn.filestackcontent.com' ||
            url.username ||
            url.password ||
            url.port ||
            url.pathname.length < 2
        )
            throw new Error('Invalid photo');
    }
    return {
        displayName: input.name.trim(),
        bio: input.bio.trim(),
        ...(input.image === undefined ? {} : { image: input.image }),
    };
};
