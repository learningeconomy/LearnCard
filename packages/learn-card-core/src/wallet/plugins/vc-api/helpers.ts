/**
 * Sends a POST request via fetch
 */
export const post = async (url: string, data: Record<string, any>): Promise<Response> =>
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

/**
 * Returns whether or not an HTTP status code is successful
 */
export const isSuccessful = (status: number) => status.toString().startsWith('2');
