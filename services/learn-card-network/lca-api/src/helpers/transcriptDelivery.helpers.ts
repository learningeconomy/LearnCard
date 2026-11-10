import { z } from 'zod';

/** Hints further out than this are treated as noise rather than shown to a student. */
export const MAX_EXPECTED_DELIVERY_MS = 30 * 24 * 60 * 60 * 1000;

const ExpectedDeliveryHintValidator = z
    .object({
        expectedInSeconds: z.number().finite().positive().optional(),
        expectedBy: z.string().datetime({ offset: true }).optional(),
    })
    .passthrough();

/**
 * When an issuer expects to deliver an accepted transcript, from the optional hint in its
 * response body: `expectedInSeconds` (preferred, immune to clock skew) or an ISO 8601
 * `expectedBy`. The hint is advisory, so anything malformed, already past, or more than
 * {@link MAX_EXPECTED_DELIVERY_MS} away is ignored rather than failing the request.
 */
export const parseExpectedDelivery = (body: unknown, now: Date): Date | undefined => {
    const parsed = ExpectedDeliveryHintValidator.safeParse(body);
    if (!parsed.success) return undefined;
    const { expectedInSeconds, expectedBy } = parsed.data;
    const at =
        expectedInSeconds !== undefined
            ? now.getTime() + expectedInSeconds * 1000
            : expectedBy !== undefined
              ? Date.parse(expectedBy)
              : undefined;
    if (at === undefined || !Number.isFinite(at)) return undefined;
    const delta = at - now.getTime();
    if (delta <= 0 || delta > MAX_EXPECTED_DELIVERY_MS) return undefined;
    return new Date(at);
};
