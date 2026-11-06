/** True only for an http(s) origin on localhost / 127.0.0.1 / [::1] without credentials. */
export const isLoopbackOrigin = (origin: string): boolean => {
    try {
        const url = new URL(origin);
        return (
            (url.protocol === 'http:' || url.protocol === 'https:') &&
            ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
            !url.username &&
            !url.password
        );
    } catch {
        return false;
    }
};
