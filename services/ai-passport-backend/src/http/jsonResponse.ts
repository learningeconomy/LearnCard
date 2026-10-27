export function createJsonResponse(
    data: unknown,
    status = 200,
    headers: Record<string, string> = {}
) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
    });
}
