export const post = async (url: string, data: Record<string, any>): Promise<Response> =>
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
