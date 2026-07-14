export const generateHandle = (name: string): string => {
    if (!name) return '';
    let handle = name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    if (handle.length < 3) {
        handle = handle + 'user';
    }

    if (handle.length > 20) {
        handle = handle.substring(0, 20);
    }

    return handle;
};

export const generateRandomSuffix = (): string => {
    return Math.random().toString(36).substring(2, 6);
};
