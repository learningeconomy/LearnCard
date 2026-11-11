// The CLI prints only the top-level manifest error. Capture the response's
// diagnostic fields without logging request bodies, URLs, or authorization.
const originalFetch = globalThis.fetch;
if (typeof originalFetch === 'function') {
    try {
        console.error('[capgo-manifest-diagnostics] installed');
    } catch {
        // Diagnostics must never affect CLI behavior, including when stderr is unavailable.
    }
    globalThis.fetch = async (...args) => {
        const response = await originalFetch(...args);
        try {
            const input = args[0];
            const url =
                typeof input === 'string' || input instanceof URL ? String(input) : input?.url;
            if (!url || !new URL(url).pathname.endsWith('/private/set_manifest')) return response;

            let body;
            try {
                body = await response.clone().json();
            } catch {
                if (!response.ok) {
                    console.error(
                        '[capgo-manifest-response] Could not decode error response; HTTP ' +
                            response.status
                    );
                }
                return response;
            }
            if (!response.ok || body?.error) {
                const redact = value => {
                    const token = process.env.CAPGO_TOKEN;
                    const variants = token
                        ? [
                              token,
                              encodeURIComponent(token),
                              Buffer.from(token).toString('base64'),
                              Buffer.from(token).toString('base64url'),
                          ]
                        : [];
                    // Include JSON-escaped forms so both string values and object keys are safe.
                    const secrets = [
                        ...new Set(
                            variants.flatMap(secret => [
                                secret,
                                JSON.stringify(secret).slice(1, -1),
                            ])
                        ),
                    ].sort((a, b) => b.length - a.length);
                    let text = JSON.stringify(value);
                    for (const secret of secrets) text = text.split(secret).join('[redacted]');
                    // Truncate only after every complete secret has been removed.
                    return text.slice(0, 12000);
                };
                console.error(
                    '[capgo-manifest-response] ' +
                        redact({
                            status: response.status,
                            requestId: response.headers.get('x-request-id'),
                            error: body?.error,
                            message: body?.message,
                            moreInfo: body?.moreInfo,
                        })
                );
            }
        } catch {
            // URL parsing, response inspection, and logging must leave fetch results intact.
        }
        return response;
    };
}
