export const generateHandle = (name: string): string => {
    if (!name) return '';

    const handle = name
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    if (handle.length > 20) {
        return handle.substring(0, 20).replace(/-+$/, '');
    }

    return handle;
};

export const generateRandomSuffix = (): string => {
    return Math.floor(Math.random() * 36 ** 4)
        .toString(36)
        .padStart(4, '0');
};
