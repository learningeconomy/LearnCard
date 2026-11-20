/** Decode a canonical base64 value of exactly 32 bytes; otherwise treat it as missing. */
export const decodeClassLinkKey = (value: string | undefined): Buffer | null => {
    const encoded = value?.trim();
    if (!encoded) return null;
    const key = Buffer.from(encoded, 'base64');
    if (key.length !== 32 || key.toString('base64') !== encoded) return null;
    return key;
};
