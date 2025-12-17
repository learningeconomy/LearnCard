export const formatDid = (did: string): string => {
    if (!did) return '';

    const [method, ...rest] = did.split(':');
    const last = rest[rest.length - 1];

    switch (method) {
        case 'did':
            if (rest[0] === 'key') {
                return `🔑 ${last.slice(0, 3)}…${last.slice(-3)}`;
            } else if (rest[0] === 'web') {
                return `🌐 ${last}`;
            } else {
                return `${did.slice(0, 12)}…${did.slice(-7)}`;
            }
        default:
            return `${did.slice(0, 12)}…${did.slice(-7)}`;
    }
};
