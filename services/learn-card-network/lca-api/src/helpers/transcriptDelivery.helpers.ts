import { z } from 'zod';

/** Hints further out than this are treated as noise rather than shown to a student. */
export const MAX_EXPECTED_DELIVERY_MS = 30 * 24 * 60 * 60 * 1000;

const ExpectedInSecondsValidator = z.number().finite().positive();
const ExpectedByValidator = z.string().datetime({ offset: true });

const field = (body: unknown, key: string): unknown =>
    body && typeof body === 'object' ? (body as Record<string, unknown>)[key] : undefined;

/**
 * When an issuer expects to deliver an accepted transcript, from the optional hint in its
 * response body: `expectedInSeconds` (preferred, immune to clock skew), counted from
 * `sentAt` when LearnCard sent the request, or an ISO 8601 `expectedBy`. Each field is
 * checked on its own, so a malformed one never discards a valid one. The hint is advisory:
 * anything unusable, already past at `now`, or more than {@link MAX_EXPECTED_DELIVERY_MS}
 * away is ignored rather than failing the request.
 */
export const parseExpectedDelivery = (
    body: unknown,
    sentAt: Date,
    now: Date = new Date()
): Date | undefined => {
    const seconds = ExpectedInSecondsValidator.safeParse(field(body, 'expectedInSeconds'));
    const by = ExpectedByValidator.safeParse(field(body, 'expectedBy'));
    const at = seconds.success
        ? sentAt.getTime() + seconds.data * 1000
        : by.success
          ? Date.parse(by.data)
          : undefined;
    if (at === undefined || !Number.isFinite(at)) return undefined;
    if (at <= now.getTime() || at - now.getTime() > MAX_EXPECTED_DELIVERY_MS) return undefined;
    return new Date(at);
};
