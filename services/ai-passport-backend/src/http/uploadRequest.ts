import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { FileUploadTypesEnum } from '../ai/generation-schemas';
import {
    MAX_HTTP_REQUEST_BODY_BYTES,
    REQUEST_BODY_TIMEOUT_MS,
    RequestBodyError,
    readBoundedRequestBody,
    validateRequestBodyHeaders,
} from './requestBody';
export { MAX_HTTP_REQUEST_BODY_BYTES } from './requestBody';

// A 4 MiB file becomes about 5.34 MiB of base64, plus its JSON envelope.
export const MAX_CONCURRENT_FILE_UPLOADS = 16;
export const MAX_FILE_UPLOADS_PER_OWNER = 2;
export const UPLOAD_BODY_TIMEOUT_MS = REQUEST_BODY_TIMEOUT_MS;
export const UPLOAD_RESERVATION_TTL_MS = 15_000;
export const UPLOAD_RESERVATION_HEADER = 'X-Upload-Reservation';

const UploadRequestValidator = z.object({
    file: z.string(),
    fileType: z.nativeEnum(FileUploadTypesEnum),
    diagnostics: z
        .object({
            enabled: z.boolean().optional(),
            operationId: z.string().uuid().optional(),
            attemptId: z.string().uuid().optional(),
            attempt: z.number().int().min(1).max(100).optional(),
        })
        .optional(),
});
type UploadRequest = z.infer<typeof UploadRequestValidator>;
type JsonResponse = (data: unknown, status?: number) => Response;

class UploadRequestError extends Error {
    constructor(
        readonly status: number,
        readonly code: string,
        message: string
    ) {
        super(message);
    }
}

const invalidBody = () => new UploadRequestError(400, 'invalid_upload_body', 'Invalid file upload');

const cancelBody = (req: Request): void => {
    void req.body?.cancel().catch(() => {});
};

const asUploadError = (error: RequestBodyError): UploadRequestError =>
    new UploadRequestError(
        error.status,
        error.code.replace('request', 'upload'),
        error.status === 413 ? 'Upload request is too large' : error.message
    );

const readUploadJson = async (req: Request, timeoutMs: number): Promise<unknown> => {
    try {
        const bytes = await readBoundedRequestBody(req, MAX_HTTP_REQUEST_BODY_BYTES, timeoutMs);
        return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    } catch (error) {
        if (error instanceof RequestBodyError) throw asUploadError(error);
        throw invalidBody();
    }
};

const UploadCapacityValidator = z
    .object({
        maxConcurrentUploads: z.coerce
            .number()
            .int()
            .min(1)
            .max(32)
            .default(MAX_CONCURRENT_FILE_UPLOADS),
        maxUploadsPerOwner: z.coerce
            .number()
            .int()
            .min(1)
            .max(32)
            .default(MAX_FILE_UPLOADS_PER_OWNER),
    })
    .refine(value => value.maxUploadsPerOwner <= value.maxConcurrentUploads);

export const getUploadCapacityConfig = (env: Record<string, string | undefined> = process.env) => {
    const parsed = UploadCapacityValidator.safeParse({
        maxConcurrentUploads: env.MAX_CONCURRENT_FILE_UPLOADS,
        maxUploadsPerOwner: env.MAX_CONCURRENT_FILE_UPLOADS_PER_OWNER,
    });
    if (!parsed.success)
        throw new Error(
            'Invalid upload capacity: use integers 1–32, with per-owner capacity no larger than total capacity'
        );
    return parsed.data;
};

/**
 * Bound in-flight uploads through processing; operators can tune both capacities.
 * Rejected requests are never queued or read. Hold admission through processing
 * and response construction, even if the client disconnects during processing.
 */
export const createUploadRequestGuard = ({
    bodyTimeoutMs = UPLOAD_BODY_TIMEOUT_MS,
    maxConcurrentUploads = MAX_CONCURRENT_FILE_UPLOADS,
    maxUploadsPerOwner = MAX_FILE_UPLOADS_PER_OWNER,
    reservationTtlMs = UPLOAD_RESERVATION_TTL_MS,
    instanceId = process.env.FLY_MACHINE_ID,
} = {}) => {
    UploadCapacityValidator.parse({ maxConcurrentUploads, maxUploadsPerOwner });
    if (!Number.isInteger(reservationTtlMs) || reservationTtlMs < 1 || reservationTtlMs > 30_000)
        throw new Error('Upload reservation TTL must be between 1 and 30000 ms');
    if (instanceId !== undefined && !/^[a-zA-Z0-9_-]{1,64}$/.test(instanceId))
        throw new Error('Invalid upload instance ID');
    const owners = new Map<string, number>();
    let active = 0;
    const reservations = new Map<
        string,
        {
            did: string;
            expiresAt: number;
            timer: ReturnType<typeof setTimeout>;
            release: () => void;
        }
    >();
    const capacityError = (did: string): UploadRequestError | undefined => {
        if ((owners.get(did) ?? 0) >= maxUploadsPerOwner)
            return new UploadRequestError(
                429,
                'upload_in_progress',
                'An upload is already in progress. Please try again shortly.'
            );
        if (active >= maxConcurrentUploads)
            return new UploadRequestError(
                503,
                'upload_capacity_exceeded',
                'Uploads are busy. Please try again shortly.'
            );
    };
    const acquire = (did: string) => {
        owners.set(did, (owners.get(did) ?? 0) + 1);
        active += 1;
        let released = false;
        return () => {
            if (released) return;
            released = true;
            active -= 1;
            const remaining = (owners.get(did) ?? 1) - 1;
            if (remaining) owners.set(did, remaining);
            else owners.delete(did);
        };
    };
    const drop = (token: string) => {
        const reservation = reservations.get(token);
        if (!reservation) return;
        reservations.delete(token);
        clearTimeout(reservation.timer);
        reservation.release();
    };
    const reject = (req: Request, respond: JsonResponse, error: UploadRequestError) => {
        cancelBody(req);
        const response = respond({ error: error.message, code: error.code }, error.status);
        if (error.status === 429 || error.status === 503) response.headers.set('Retry-After', '5');
        response.headers.set('Cache-Control', 'no-store');
        return response;
    };
    const bodyless = (req: Request, respond: JsonResponse): Response | undefined => {
        try {
            validateRequestBodyHeaders(req, 0);
            // Ingress already enforces zero actual bytes for this route. A stream can be empty.
        } catch (error) {
            if (error instanceof RequestBodyError)
                return reject(req, respond, asUploadError(error));
            throw error;
        }
    };
    const reserve = (req: Request, did: string, respond: JsonResponse): Response => {
        const invalid = bodyless(req, respond);
        if (invalid) return invalid;
        // Pending leases are cheaper to hold than consumed work: allow only one per owner.
        if ([...reservations.values()].some(reservation => reservation.did === did))
            return reject(
                req,
                respond,
                new UploadRequestError(
                    429,
                    'upload_in_progress',
                    'An upload reservation is already pending. Please try again shortly.'
                )
            );
        const busy = capacityError(did);
        if (busy) return reject(req, respond, busy);
        const token = randomBytes(32).toString('base64url');
        const release = acquire(did);
        const expiresAt = Date.now() + reservationTtlMs;
        const timer = setTimeout(() => drop(token), reservationTtlMs);
        timer.unref?.();
        reservations.set(token, { did, expiresAt, timer, release });
        const response = respond({ token, expiresAt, ...(instanceId ? { instanceId } : {}) }, 201);
        response.headers.set('Cache-Control', 'no-store');
        return response;
    };
    const releaseReservation = (req: Request, did: string, respond: JsonResponse): Response => {
        const invalid = bodyless(req, respond);
        if (invalid) return invalid;
        const token = req.headers.get(UPLOAD_RESERVATION_HEADER);
        // Unknown, consumed and other-owner tokens are indistinguishable and cannot release work.
        const released = Boolean(token && reservations.get(token)?.did === did);
        if (token && released) drop(token);
        const response = respond({ released });
        response.headers.set('Cache-Control', 'no-store');
        return response;
    };
    const guard = async (
        req: Request,
        did: string,
        respond: JsonResponse,
        operation: (body: UploadRequest) => Promise<Response>
    ): Promise<Response> => {
        try {
            validateRequestBodyHeaders(req, MAX_HTTP_REQUEST_BODY_BYTES);
        } catch (error) {
            if (error instanceof RequestBodyError) {
                const token = req.headers.get(UPLOAD_RESERVATION_HEADER);
                // Only unused, caller-owned reservations can be released on early rejection.
                if (token && reservations.get(token)?.did === did) drop(token);
                return reject(req, respond, asUploadError(error));
            }
            throw error;
        }
        let release: () => void;
        const token = req.headers.get(UPLOAD_RESERVATION_HEADER);
        if (token !== null) {
            const reservation = reservations.get(token);
            if (!reservation || reservation.did !== did || reservation.expiresAt <= Date.now()) {
                if (reservation?.did === did && reservation.expiresAt <= Date.now()) drop(token);
                return reject(
                    req,
                    respond,
                    new UploadRequestError(
                        409,
                        'upload_reservation_invalid',
                        'Upload reservation is unavailable. Please try again.'
                    )
                );
            }
            // Synchronously consume once; TTL applies only before transfer, not during processing.
            reservations.delete(token);
            clearTimeout(reservation.timer);
            release = reservation.release;
        } else {
            // Older clients continue using the same shared capacity pool.
            const busy = capacityError(did);
            if (busy) return reject(req, respond, busy);
            release = acquire(did);
        }
        try {
            const parsed = UploadRequestValidator.safeParse(
                await readUploadJson(req, bodyTimeoutMs)
            );
            if (!parsed.success) return reject(req, respond, invalidBody());
            return await operation(parsed.data);
        } catch (error) {
            if (error instanceof UploadRequestError) return reject(req, respond, error);
            throw error;
        } finally {
            release();
        }
    };
    return Object.assign(guard, { reserve, releaseReservation });
};
