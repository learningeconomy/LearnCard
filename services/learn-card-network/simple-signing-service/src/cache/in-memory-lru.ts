export const getLRUCache = <T>(limit = 50) => {
    let items: { key: string; value: T; timestamp: number }[] = [];

    const get = (key: string) => {
        const index = items.findIndex(item => item.key === key);

        if (index === -1) return;

        items[index]!.timestamp = Date.now();

        const value = items[index]!.value;

        items.sort((a, b) => b.timestamp - a.timestamp);

        items = items.slice(0, limit);

        return value;
    };

    const add = (key: string, value: T) => {
        items.unshift({ key, value, timestamp: Date.now() });

        items = items.slice(0, limit);

        return true;
    };

    const flush = () => {
        items = [];

        return true;
    };

    return { get, add, flush };
};
