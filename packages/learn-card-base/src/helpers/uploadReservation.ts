import { z } from 'zod';
import { aiPassportFetch } from './aiPassportAuth';
import { waitForUploadCapacity } from './uploadCapacity';

const Reservation = z.object({
    token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    expiresAt: z.number().int().positive(),
    instanceId: z
        .string()
        .regex(/^[A-Za-z0-9_-]{1,64}$/)
        .optional(),
});

/** Wait using bodyless admission requests, then transfer the file at most once. */
export const sendWithUploadReservation = async (
    send: (headers: Record<string, string>) => Promise<Response>,
    options: {
        url: string;
        did: string;
        signal: AbortSignal;
        waitSignal?: AbortSignal;
        onWaiting?: (waiting: boolean) => void;
    }
): Promise<Response> => {
    const admission = new AbortController();
    const signals = [options.signal, options.waitSignal];
    const abort = () => admission.abort();
    for (const signal of signals) {
        if (signal?.aborted) abort();
        else signal?.addEventListener('abort', abort, { once: true });
    }
    let headers: Record<string, string> | undefined;
    let successfulUpload = false;
    try {
        let response: Response;
        try {
            response = await waitForUploadCapacity(
                () =>
                    aiPassportFetch(
                        options.url,
                        { method: 'POST', signal: admission.signal },
                        options.did
                    ),
                { signal: admission.signal, onWaiting: options.onWaiting }
            );
        } catch (error) {
            if (admission.signal.aborted) throw new DOMException('Upload cancelled', 'AbortError');
            throw error;
        }
        if (response.status !== 201) return response;
        const parsed = Reservation.safeParse(
            await response
                .clone()
                .json()
                .catch(() => undefined)
        );
        if (!parsed.success) {
            if (admission.signal.aborted) throw new DOMException('Upload cancelled', 'AbortError');
            return response;
        }
        headers = {
            'X-Upload-Reservation': parsed.data.token,
            ...(parsed.data.instanceId ? { 'fly-force-instance-id': parsed.data.instanceId } : {}),
        };
        if (admission.signal.aborted) throw new DOMException('Upload cancelled', 'AbortError');
        // After admission, foreground Cancel cannot abort or replay accepted extraction.
        const result = await send(headers);
        successfulUpload = result.ok;
        return result;
    } finally {
        for (const signal of signals) signal?.removeEventListener('abort', abort);
        if (headers && !successfulUpload && !options.signal.aborted) {
            // Idempotent: consumed tickets cannot cancel processing. TTL covers lost cleanup.
            void aiPassportFetch(
                options.url,
                {
                    method: 'DELETE',
                    headers,
                    signal: AbortSignal.timeout(2000),
                },
                options.did
            ).catch(() => {});
        }
    }
};
