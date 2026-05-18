export const SD_JWT_SALT_LENGTH_BYTES = 16;

const bytesToBase64Url = (bytes: Uint8Array): string => {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const randomSalt = (length: number = SD_JWT_SALT_LENGTH_BYTES): string => {
    if (!Number.isInteger(length) || length < SD_JWT_SALT_LENGTH_BYTES) {
        length = SD_JWT_SALT_LENGTH_BYTES;
    }
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytesToBase64Url(bytes);
};
